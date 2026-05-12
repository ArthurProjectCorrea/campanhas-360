using Api.Data;
using Api.DTOs;
using Api.Models;
using Api.Services;
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
    private readonly IEmailService _emailService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConnectionMultiplexer redis,
        IEmailService emailService)
    {
        _userManager = userManager;
        _context = context;
        _redis = redis.GetDatabase();
        _emailService = emailService;
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

        // 5. Buscar permissões do perfil
        var permissions = await GetUserPermissionsAsync(profile.Id);

        // 9. Criar sessão no redis com expiração de 1 hora
        var token = Guid.NewGuid().ToString();
        var sessionData = new
        {
            UserId = user.Id,
            UserName = user.Name,
            ClientId = client.Id,
            ClientDomain = client.Domain,
            AccessProfileId = profile.Id,
            AccessProfileName = profile.Name,
            Permissions = permissions
        };

        await _redis.StringSetAsync(token, JsonSerializer.Serialize(sessionData, BaseApiController.JsonOptions), TimeSpan.FromHours(1));

        // 9.1. Adicionar token ao set de sessões do usuário para permitir invalidação global
        await _redis.SetAddAsync($"user_tokens:{user.Id}", token);
        await _redis.KeyExpireAsync($"user_tokens:{user.Id}", TimeSpan.FromHours(1));

        // 10. Retorna dados e token
        return Ok(new SignInResponse(
            token,
            user.Id,
            user.Name,
            client.Id,
            client.Domain,
            profile.Id,
            profile.Name,
            permissions
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
        var json = await _redis.StringGetAsync(token);
        if (!json.IsNullOrEmpty)
        {
            var session = JsonSerializer.Deserialize<BaseApiController.SessionData>((string)json!, BaseApiController.JsonOptions);
            if (session != null)
            {
                await _redis.SetRemoveAsync($"user_tokens:{session.UserId}", token);
            }
        }

        await _redis.KeyDeleteAsync(token);

        return Ok(new { message = "Sessão encerrada com sucesso" });
    }

    /// <summary>
    /// Valida a sessão e retorna os dados rápidos guardados em cache (Redis).
    /// </summary>
    /// <remarks>
    /// Este endpoint é utilizado para verificação rápida de integridade da sessão e para obter as permissões
    /// do usuário que estão persistidas no Redis. Para dados detalhados do banco, use /users/me.
    /// </remarks>
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

    /// <summary>
    /// Valida a sessão atual, recarrega os dados do banco e gera um novo token (Token Rotation).
    /// </summary>
    /// <returns>Novo token e dados atualizados.</returns>
    /// <response code="200">Sessão renovada com sucesso.</response>
    /// <response code="401">Sessão inválida ou expirada.</response>
    /// <response code="403">Usuário, Cliente ou Perfil inativado.</response>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(SignInResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> Refresh()
    {
        // 1. Receber o token antigo
        var authHeader = Request.Headers["Authorization"].ToString();
        var oldToken = authHeader.Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(oldToken))
        {
            return Unauthorized(new { message = "Token não fornecido" });
        }

        // 2. Validar se a sessão existe no Redis
        var sessionDataJson = await _redis.StringGetAsync(oldToken);
        if (sessionDataJson.IsNullOrEmpty)
        {
            return Unauthorized(new { message = "Sessão inválida ou expirada" });
        }

        // 3. Extrair UserId para recarregar do DB
        using var doc = JsonDocument.Parse((string)sessionDataJson!);
        if (!doc.RootElement.TryGetProperty("UserId", out var userIdProp))
        {
            return Unauthorized(new { message = "Dados de sessão corrompidos" });
        }
        var userId = userIdProp.GetGuid();

        // 4. Buscar dados atualizados no PostgreSQL
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || !user.IsActive)
        {
            await _redis.KeyDeleteAsync(oldToken);
            return StatusCode(403, new { message = "Usuário inexistente ou inativo" });
        }

        var client = await _context.Clients.FindAsync(user.ClientId);
        if (client == null || !client.IsActive)
        {
            await _redis.KeyDeleteAsync(oldToken);
            return StatusCode(403, new { message = "Cliente inativo" });
        }

        var profile = await _context.AccessProfiles.FindAsync(user.AccessProfileId);
        if (profile == null || !profile.IsActive)
        {
            await _redis.KeyDeleteAsync(oldToken);
            return StatusCode(403, new { message = "Perfil de acesso inativo" });
        }

        // 5. Gerar novo token e nova sessão
        var permissions = await GetUserPermissionsAsync(profile.Id);
        var newToken = Guid.NewGuid().ToString();
        var newSessionData = new
        {
            UserId = user.Id,
            UserName = user.Name,
            ClientId = client.Id,
            ClientDomain = client.Domain,
            AccessProfileId = profile.Id,
            AccessProfileName = profile.Name,
            Permissions = permissions
        };

        // Salvar nova sessão (TTL 1h)
        await _redis.StringSetAsync(newToken, JsonSerializer.Serialize(newSessionData), TimeSpan.FromHours(1));

        // 6. Remover token antigo
        await _redis.KeyDeleteAsync(oldToken);

        // 7. Retornar resposta
        return Ok(new SignInResponse(
            newToken,
            user.Id,
            user.Name,
            client.Id,
            client.Domain,
            profile.Id,
            profile.Name,
            permissions
        ));
    }

    private async Task<List<UserPermissionDto>> GetUserPermissionsAsync(Guid profileId)
    {
        return await _context.Accesses
            .Where(a => a.AccessProfileId == profileId)
            .Select(a => new UserPermissionDto(
                a.Screen.Key,
                a.Permission.Key,
                a.Screen.Icon,
                a.Screen.Sidebar ?? a.Screen.Title))
            .ToListAsync();
    }

    /// <summary>
    /// Solicita o envio de um código OTP para recuperação de senha.
    /// </summary>
    /// <response code="200">Sempre retorna sucesso para evitar enumeração.</response>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null) return Ok(new { message = "Se o e-mail estiver cadastrado, você receberá um código em instantes." });

        // Validar integridade da conta (User + Client + Profile ativos)
        var client = await _context.Clients.FindAsync(user.ClientId);
        var profile = await _context.AccessProfiles.FindAsync(user.AccessProfileId);

        if (user.IsActive && client is { IsActive: true } && profile is { IsActive: true })
        {
            // Gerar OTP de 6 dígitos
            var otp = new Random().Next(100000, 999999).ToString();

            // Salvar no Redis (otp:email -> userId) por 5 minutos
            await _redis.StringSetAsync($"otp:{user.Email}", user.Id.ToString(), TimeSpan.FromMinutes(5));
            await _redis.StringSetAsync($"otp_code:{user.Email}", otp, TimeSpan.FromMinutes(5));

            // Disparar e-mail
            await _emailService.SendOtpEmailAsync(user.Email!, user.Name, otp);
        }

        return Ok(new { message = "Se o e-mail estiver cadastrado, você receberá um código em instantes." });
    }

    /// <summary>
    /// Valida o código OTP e retorna um token de redefinição de senha.
    /// </summary>
    /// <response code="200">Código válido, retorna o resetToken.</response>
    /// <response code="400">Código inválido ou expirado.</response>
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var savedOtp = await _redis.StringGetAsync($"otp_code:{request.Email}");
        if (savedOtp.IsNullOrEmpty || savedOtp != request.Otp)
        {
            return BadRequest(new { message = "Código inválido ou expirado." });
        }

        var userId = await _redis.StringGetAsync($"otp:{request.Email}");

        // Gerar Reset Token
        var resetToken = Guid.NewGuid().ToString();
        await _redis.StringSetAsync($"reset_token:{resetToken}", userId!, TimeSpan.FromMinutes(10));

        // Limpar OTP
        await _redis.KeyDeleteAsync($"otp:{request.Email}");
        await _redis.KeyDeleteAsync($"otp_code:{request.Email}");

        return Ok(new { resetToken });
    }

    /// <summary>
    /// Redefine a senha do usuário utilizando um token válido.
    /// </summary>
    /// <response code="200">Senha alterada com sucesso.</response>
    /// <response code="400">Token inválido ou expirado.</response>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var userIdString = await _redis.StringGetAsync($"reset_token:{request.ResetToken}");
        if (userIdString.IsNullOrEmpty)
        {
            return BadRequest(new { message = "Token de redefinição inválido ou expirado." });
        }

        var user = await _userManager.FindByIdAsync(userIdString!);
        if (user == null)
        {
            return BadRequest(new { message = "Usuário não encontrado." });
        }

        // Remover senha antiga e adicionar a nova (ou usar ResetPassword se tivermos o token de identity)
        // Como estamos usando nosso próprio fluxo de OTP, podemos usar RemovePassword e AddPassword
        await _userManager.RemovePasswordAsync(user);
        var result = await _userManager.AddPasswordAsync(user, request.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        // Limpar Token
        await _redis.KeyDeleteAsync($"reset_token:{request.ResetToken}");

        // Invalida todas as sessões ativas (Force Logout) - Opcional, mas recomendado
        // Aqui precisaríamos de uma forma de rastrear todos os tokens de um usuário.
        // Por enquanto, apenas deletamos o token de reset.

        return Ok(new { message = "Senha redefinida com sucesso." });
    }
}
