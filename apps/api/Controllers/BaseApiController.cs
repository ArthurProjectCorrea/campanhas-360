using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers;

public abstract class BaseApiController : ControllerBase
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    protected readonly IDatabase Redis;
    protected readonly Data.ApplicationDbContext Context;

    protected BaseApiController(Data.ApplicationDbContext context, IConnectionMultiplexer redis)
    {
        Context = context;
        Redis = redis.GetDatabase();
    }

    protected async Task<ScreenMetadata> GetScreenMetadataAsync(string key)
    {
        var screen = await Context.Screens
            .Where(s => s.Key == key)
            .Select(s => new ScreenMetadata(s.Title, s.Description ?? ""))
            .FirstOrDefaultAsync();

        return screen ?? new ScreenMetadata("Título", "Descrição");
    }

    protected async Task<SessionData?> GetSessionAsync()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        var token = authHeader.Replace("Bearer ", "").Trim();

        if (string.IsNullOrEmpty(token)) return null;

        var json = await Redis.StringGetAsync(token);
        if (json.IsNullOrEmpty) return null;

        var session = JsonSerializer.Deserialize<SessionData>((string)json!, JsonOptions);
        if (session == null || session.ClientId == Guid.Empty) return null;
        return session;
    }

    protected bool HasPermission(SessionData session, string screenKey, string permissionKey)
    {
        return session.Permissions.Any(p => p.Screen == screenKey && p.Key == permissionKey);
    }

    public class SessionData
    {
        public Guid UserId { get; set; }
        public Guid ClientId { get; set; }
        public List<UserPermissionDto> Permissions { get; set; } = new();
    }
}
