using Api.Data;
using Api.DTOs;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers;

[ApiController]
[Route("organization-profile")]
public class OrganizationProfileController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public OrganizationProfileController(
        ApplicationDbContext context,
        IConnectionMultiplexer redis,
        IWebHostEnvironment environment) : base(context, redis)
    {
        _context = context;
        _environment = environment;
    }

    /// <summary>
    /// Lista os dados do candidato e suas campanhas para o cliente autenticado.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "organization_profile", "view"))
            return Forbid();

        var screen = await GetScreenMetadataAsync("organization_profile");

        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.ClientId == session.ClientId && c.DeletedAt == null);

        var campaigns = await _context.Campaigns
            .Include(c => c.Party)
            .Include(c => c.Position)
            .Include(c => c.State)
            .Include(c => c.Municipality)
            .Where(c => c.ClientId == session.ClientId && c.DeletedAt == null)
            .OrderByDescending(c => c.ElectionYear)
            .Select(c => new CampaignResponse(
                c.Id,
                c.CandidateNumber,
                c.ElectionYear,
                c.PartyId,
                c.Party.Name,
                c.PositionId,
                c.Position.Name,
                c.StateId,
                c.State != null ? c.State.Name : null,
                c.MunicipalityId,
                c.Municipality != null ? c.Municipality.Name : null,
                c.LegalSpendingLimit,
                c.IsActive
            ))
            .ToListAsync();

        var candidateResponse = candidate != null ? new CandidateResponse(
            candidate.Id,
            candidate.Name,
            candidate.AvatarUrl,
            candidate.BallotName,
            candidate.CPF,
            candidate.SocialName,
            candidate.BirthDate
        ) : null;

        var metadata = new MetadataResponse(
            await _context.Positions.OrderBy(p => p.Name).Select(p => new PositionMetadata(p.Id, p.Name, p.Type)).ToListAsync(),
            await _context.States.OrderBy(s => s.Name).Select(s => new StateMetadata(s.Id, s.Name, s.Acronym)).ToListAsync(),
            await _context.Parties.OrderBy(p => p.Name).Select(p => new PartyMetadata(p.Id, p.Name, p.Acronym)).ToListAsync()
        );

        return Ok(new OrganizationProfileResponse(
            screen,
            candidateResponse,
            campaigns,
            new ProfilePermissions(
                HasPermission(session, "organization_profile", "update"),
                HasPermission(session, "organization_profile", "create")
            ),
            metadata
        ));
    }

    /// <summary>
    /// Atualiza os dados do candidato e da campanha ativa em uma única operação.
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromForm] UpsertProfileRequest request, IFormFile? avatar)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "organization_profile", "update"))
            return Forbid();

        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.ClientId == session.ClientId && c.DeletedAt == null);

        if (candidate == null) return NotFound("Candidato não encontrado.");

        // 1. Atualizar Candidato
        candidate.Name = request.CandidateName;
        candidate.BallotName = request.BallotName;
        candidate.CPF = request.CPF;
        candidate.SocialName = request.SocialName;
        candidate.BirthDate = request.BirthDate;
        candidate.UpdatedAt = DateTime.UtcNow;

        // 2. Processar Avatar se enviado
        if (avatar != null)
        {
            var oldPath = candidate.AvatarUrl;
            candidate.AvatarUrl = await SaveAvatarAsync(avatar, session.ClientId);
            DeleteOldFile(oldPath);
        }

        // 3. Atualizar Campanha Ativa se fornecido ID
        if (request.CampaignId.HasValue)
        {
            var campaign = await _context.Campaigns
                .FirstOrDefaultAsync(c => c.Id == request.CampaignId && c.ClientId == session.ClientId && c.DeletedAt == null);

            if (campaign != null && campaign.IsActive)
            {
                campaign.CandidateNumber = request.CandidateNumber ?? campaign.CandidateNumber;
                campaign.ElectionYear = request.ElectionYear ?? campaign.ElectionYear;
                campaign.PartyId = request.PartyId ?? campaign.PartyId;
                campaign.PositionId = request.PositionId ?? campaign.PositionId;
                campaign.StateId = request.StateId ?? campaign.StateId;
                campaign.MunicipalityId = request.MunicipalityId ?? campaign.MunicipalityId;
                campaign.LegalSpendingLimit = request.LegalSpendingLimit ?? campaign.LegalSpendingLimit;
                campaign.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Cria uma nova campanha e inativa as anteriores.
    /// </summary>
    [HttpPost("campaigns")]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "organization_profile", "create"))
            return Forbid();

        var candidate = await _context.Candidates
            .FirstOrDefaultAsync(c => c.ClientId == session.ClientId && c.DeletedAt == null);

        if (candidate == null) return NotFound("Candidato não encontrado.");

        // Inativar campanhas anteriores
        var activeCampaigns = await _context.Campaigns
            .Where(c => c.CandidateId == candidate.Id && c.IsActive)
            .ToListAsync();

        foreach (var c in activeCampaigns)
        {
            c.IsActive = false;
            c.UpdatedAt = DateTime.UtcNow;
        }

        // Criar nova
        var campaign = new Campaign
        {
            CandidateId = candidate.Id,
            ClientId = session.ClientId,
            CandidateNumber = request.CandidateNumber,
            ElectionYear = request.ElectionYear,
            PartyId = request.PartyId,
            PositionId = request.PositionId,
            StateId = request.StateId,
            MunicipalityId = request.MunicipalityId,
            LegalSpendingLimit = request.LegalSpendingLimit,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return Ok(new { id = campaign.Id });
    }

    /// <summary>
    /// Inativa uma campanha específica.
    /// </summary>
    [HttpPut("campaigns/{id}/inactivate")]
    public async Task<IActionResult> InactivateCampaign(int id)
    {
        var session = await GetSessionAsync();
        if (session == null) return Unauthorized();

        if (!HasPermission(session, "organization_profile", "update"))
            return Forbid();

        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.ClientId == session.ClientId && c.DeletedAt == null);

        if (campaign == null) return NotFound();

        campaign.IsActive = false;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> SaveAvatarAsync(IFormFile file, Guid clientId)
    {
        var storagePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "storage", "clients", clientId.ToString(), "candidate");
        if (!Directory.Exists(storagePath))
        {
            Directory.CreateDirectory(storagePath);
        }

        var fileName = $"avatar_{DateTime.UtcNow.Ticks}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(storagePath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Retornar URL relativa para ser servida via StaticFiles
        return $"/storage/clients/{clientId}/candidate/{fileName}";
    }

    private void DeleteOldFile(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;

        var relativePath = url.TrimStart('/');
        var fullPath = Path.Combine(_environment.ContentRootPath, "wwwroot", relativePath);

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }
    }
}
