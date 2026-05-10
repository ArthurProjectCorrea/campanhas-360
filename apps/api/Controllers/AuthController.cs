using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Text.Json;

namespace Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IDatabase _redis;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConnectionMultiplexer redis)
    {
        _userManager = userManager;
        _context = context;
        _redis = redis.GetDatabase();
    }

    /// <summary>
    /// Realiza a autenticação do usuário e gera um token de sessão.
    /// </summary>
    /// <param name="request">Credenciais de acesso (Email e Senha).</param>
    /// <returns>Token de sessão e dados do usuário/cliente.</returns>
    /// <response code="200">Autenticação realizada com sucesso.</response>
    /// <response code="401">Credenciais inválidas.</response>
    /// <response code="403">Usuário, Cliente ou Perfil inativo.</response>
    /// <response code="429">Limite de tentativas de login excedido.</response>
    [HttpPost("sign-in")]
    [EnableRateLimiting("auth-limit")]
    [ProducesResponseType(typeof(SignInResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
    {
        // 1. Validar credenciais email+senha
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Credenciais inválidas" });
        }

        // 2. Validar se o usuário está ativo
        if (!user.IsActive)
        {
            return StatusCode(403, new { message = "Usuário inativo" });
        }

        // 3. Validar se o client está ativo
        var client = await _context.Clients.FindAsync(user.ClientId);
        if (client == null || !client.IsActive)
        {
            return StatusCode(403, new { message = "Cliente inativo" });
        }

        // 4. Validar se o perfil de acesso está ativo
        var profile = await _context.AccessProfiles.FindAsync(user.AccessProfileId);
        if (profile == null || !profile.IsActive)
        {
            return StatusCode(403, new { message = "Perfil de acesso inativo" });
        }

        // 9. Criar sessão no redis com expiração de 1 hora
        var token = Guid.NewGuid().ToString();
        var sessionData = new
        {
            UserId = user.Id,
            UserName = user.Name,
            ClientId = client.Id,
            ClientDomain = client.Domain,
            AccessProfileId = profile.Id,
            AccessProfileName = profile.Name
        };

        await _redis.StringSetAsync(token, JsonSerializer.Serialize(sessionData), TimeSpan.FromHours(1));

        // 10. Retorna dados e token
        return Ok(new SignInResponse(
            token,
            user.Id,
            user.Name,
            client.Id,
            client.Domain,
            profile.Id,
            profile.Name
        ));
    }

    /// <summary>
    /// Encerra a sessão do usuário invalidando o token no Redis.
    /// </summary>
    /// <returns>Mensagem de sucesso ou erro.</returns>
    /// <response code="200">Sessão encerrada com sucesso.</response>
    /// <response code="401">Token inválido ou sessão já expirada.</response>
    [HttpPost("sign-out")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Logout()
    {
        // 1. Receber o token (assumindo que vem no header Authorization)
        var authHeader = Request.Headers["Authorization"].ToString();
        var token = authHeader.Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(new { message = "Token não fornecido" });
        }

        // 2. Invalida a sessão no redis
        var exists = await _redis.KeyExistsAsync(token);
        if (!exists)
        {
            return Unauthorized(new { message = "Sessão inválida ou expirada" });
        }

        await _redis.KeyDeleteAsync(token);

        return Ok(new { message = "Sessão encerrada com sucesso" });
    }

    /// <summary>
    /// Retorna os dados da sessão do usuário logado se o token for válido.
    /// </summary>
    /// <returns>Dados da sessão persistidos no Redis.</returns>
    /// <response code="200">Sessão válida.</response>
    /// <response code="401">Token inválido ou sessão expirada.</response>
    [HttpGet("me")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetMe()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        var token = authHeader.Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(new { message = "Token não fornecido" });
        }

        var sessionDataJson = await _redis.StringGetAsync(token);
        if (sessionDataJson.IsNullOrEmpty)
        {
            return Unauthorized(new { message = "Sessão inválida ou expirada" });
        }

        // Retorna o JSON serializado diretamente do Redis
        return Content(sessionDataJson!, "application/json");
    }
}
