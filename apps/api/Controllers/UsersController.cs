using Api.Data;
using Api.DTOs;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers;

[ApiController]
[Route("users")]
public class UsersController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConnectionMultiplexer redis,
        IEmailService emailService) : base(context, redis)
    {
        _userManager = userManager;
        _context = context;
        _emailService = emailService;
    }

    /// <summary>
    /// Lista todos os usuários do cliente autenticado.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "user_registration", "view"))
            return Forbid();

        var screen = await GetScreenMetadataAsync("user_registration");

        var users = await _userManager.Users
            .Include(u => u.AccessProfile)
            .Where(u => u.ClientId == session.ClientId && u.DeletedAt == null)
            .OrderBy(u => u.Name)
            .Select(u => new UserResponse(
                u.Id,
                u.Name,
                u.Email!,
                u.AccessProfileId,
                u.AccessProfile.Name,
                u.IsActive,
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(new { screen, data = users });
    }

    /// <summary>
    /// Retorna os detalhes de um usuário específico.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "user_registration", "view"))
            return Forbid();

        var user = await _userManager.Users
            .Include(u => u.AccessProfile)
            .FirstOrDefaultAsync(u => u.Id == id && u.ClientId == session.ClientId && u.DeletedAt == null);

        if (user == null) return NotFound();

        return Ok(new UserResponse(
            user.Id,
            user.Name,
            user.Email!,
            user.AccessProfileId,
            user.AccessProfile.Name,
            user.IsActive,
            user.CreatedAt
        ));
    }

    /// <summary>
    /// Cria um novo usuário, gera senha e envia por e-mail.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertUserRequest request)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "user_registration", "create"))
            return Forbid();

        // 1. Validar se o e-mail já existe globalmente (incluindo excluídos)
        var existingUser = await _userManager.Users.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == request.Email);

        if (existingUser)
        {
            return BadRequest(new { message = "Este e-mail já está em uso no sistema." });
        }

        // 2. Gerar senha aleatória
        var password = GenerateRandomPassword();

        // 3. Criar o usuário
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            ClientId = session.ClientId,
            AccessProfileId = request.AccessProfileId,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Erro ao criar usuário.", errors = result.Errors });
        }

        // 4. Enviar e-mail de boas-vindas
        await _emailService.SendWelcomeEmailAsync(user.Email, user.Name, password);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.AccessProfileId,
            "", // Nome do perfil será carregado no refresh da lista
            user.IsActive,
            user.CreatedAt
        ));
    }

    /// <summary>
    /// Atualiza dados do usuário e invalida sessão se inativado.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertUserRequest request)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "user_registration", "update"))
            return Forbid();

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.ClientId == session.ClientId && u.DeletedAt == null);

        if (user == null) return NotFound();

        // Validar unicidade de e-mail se alterado
        if (user.Email != request.Email)
        {
            var emailExists = await _userManager.Users.IgnoreQueryFilters()
                .AnyAsync(u => u.Email == request.Email && u.Id != id);
            if (emailExists)
            {
                return BadRequest(new { message = "Este e-mail já está em uso por outro usuário." });
            }
            user.UserName = request.Email;
            user.Email = request.Email;
        }

        bool wasActive = user.IsActive;

        user.Name = request.Name;
        user.AccessProfileId = request.AccessProfileId;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Erro ao atualizar usuário.", errors = result.Errors });
        }

        // 5. Se inativado, invalidar todas as sessões no Redis
        if (wasActive && !user.IsActive)
        {
            await InvalidateUserSessionsAsync(user.Id);
        }

        return NoContent();
    }

    /// <summary>
    /// Exclusão lógica e invalidação imediata de sessão.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "user_registration", "delete"))
            return Forbid();

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.ClientId == session.ClientId && u.DeletedAt == null);

        if (user == null) return NotFound();

        user.DeletedAt = DateTime.UtcNow;
        user.IsActive = false;

        await _userManager.UpdateAsync(user);

        // 6. Invalidação imediata no Redis
        await InvalidateUserSessionsAsync(user.Id);

        return NoContent();
    }

    private string GenerateRandomPassword(int length = 10)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private async Task InvalidateUserSessionsAsync(Guid userId)
    {
        var tokens = await Redis.SetMembersAsync($"user_tokens:{userId}");
        foreach (var token in tokens)
        {
            await Redis.KeyDeleteAsync((string)token!);
        }
        await Redis.KeyDeleteAsync($"user_tokens:{userId}");
    }
}
