using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Text.Json;

namespace Api.Controllers;

[ApiController]
[Route("access-profiles")]
public class AccessProfilesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IDatabase _redis;

    public AccessProfilesController(ApplicationDbContext context, IConnectionMultiplexer redis)
    {
        _context = context;
        _redis = redis.GetDatabase();
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "access_profile", "view"))
            return Forbid();

        var profiles = await _context.AccessProfiles
            .Where(p => p.ClientId == session.ClientId && p.DeletedAt == null)
            .OrderBy(p => p.Name)
            .Select(p => new AccessProfileResponse
            {
                Id = p.Id,
                Name = p.Name,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(profiles);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "access_profile", "view"))
            return Forbid();

        var profile = await _context.AccessProfiles
            .Include(p => p.Accesses)
                .ThenInclude(a => a.Screen)
            .Include(p => p.Accesses)
                .ThenInclude(a => a.Permission)
            .FirstOrDefaultAsync(p => p.Id == id && p.ClientId == session.ClientId && p.DeletedAt == null);

        if (profile == null) return NotFound();

        return Ok(new AccessProfileResponse
        {
            Id = profile.Id,
            Name = profile.Name,
            IsActive = profile.IsActive,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
            Accesses = profile.Accesses.Select(a => new AccessResponse
            {
                ScreenId = a.ScreenId,
                ScreenKey = a.Screen.Key,
                PermissionId = a.PermissionId,
                PermissionKey = a.Permission.Key
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AccessProfileRequest request)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "access_profile", "create"))
            return Forbid();

        var profile = new AccessProfile
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            IsActive = request.IsActive,
            ClientId = session.ClientId,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var acc in request.Accesses)
        {
            profile.Accesses.Add(new Access
            {
                ScreenId = acc.ScreenId,
                PermissionId = acc.PermissionId
            });
        }

        _context.AccessProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = profile.Id }, null);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AccessProfileRequest request)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "access_profile", "update"))
            return Forbid();

        var profile = await _context.AccessProfiles
            .Include(p => p.Accesses)
            .FirstOrDefaultAsync(p => p.Id == id && p.ClientId == session.ClientId && p.DeletedAt == null);

        if (profile == null) return NotFound();

        profile.Name = request.Name;
        profile.IsActive = request.IsActive;
        profile.UpdatedAt = DateTime.UtcNow;

        // Sincronizar acessos (remover antigos e adicionar novos)
        _context.Accesses.RemoveRange(profile.Accesses);

        foreach (var acc in request.Accesses)
        {
            profile.Accesses.Add(new Access
            {
                ScreenId = acc.ScreenId,
                PermissionId = acc.PermissionId
            });
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "access_profile", "delete"))
            return Forbid();

        var profile = await _context.AccessProfiles
            .FirstOrDefaultAsync(p => p.Id == id && p.ClientId == session.ClientId && p.DeletedAt == null);

        if (profile == null) return NotFound();

        profile.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<SessionData?> GetSessionAsync()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        var token = authHeader.Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token)) return null;

        var json = await _redis.StringGetAsync(token);
        if (json.IsNullOrEmpty) return null;

        return JsonSerializer.Deserialize<SessionData>((string)json!);
    }

    private bool HasPermission(SessionData session, string screenKey, string permissionKey)
    {
        // Se for o perfil Administrador (ou tiver todas as permissões), permitimos tudo por simplicidade no momento
        // Ou verificamos a matriz exata
        return session.Permissions.Any(p => p.Screen == screenKey && p.Key == permissionKey);
    }

    private class SessionData
    {
        public Guid UserId { get; set; }
        public Guid ClientId { get; set; }
        public List<UserPermissionDto> Permissions { get; set; } = new();
    }
}
