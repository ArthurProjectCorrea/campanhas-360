using System;
using System.Collections.Generic;

namespace Api.DTOs;

public record CandidateResponse(
    int Id,
    string Name,
    string? AvatarUrl,
    string? BallotName,
    string? CPF,
    string? SocialName,
    DateTime? BirthDate
);

public record CampaignResponse(
    int Id,
    int CandidateNumber,
    int ElectionYear,
    int PartyId,
    string PartyName,
    int PositionId,
    string PositionName,
    int? StateId,
    string? StateName,
    int? MunicipalityId,
    string? MunicipalityName,
    decimal LegalSpendingLimit,
    bool IsActive
);

public record PositionMetadata(int Id, string Name, string Type);
public record StateMetadata(int Id, string Name, string Acronym);
public record MunicipalityMetadata(int Id, string Name);
public record PartyMetadata(int Id, string Name, string Acronym);

public record MetadataResponse(
    IEnumerable<PositionMetadata> Positions,
    IEnumerable<StateMetadata> States,
    IEnumerable<PartyMetadata> Parties
);

public record OrganizationProfileResponse(
    ScreenMetadata Screen,
    CandidateResponse? Candidate,
    IEnumerable<CampaignResponse> Campaigns,
    ProfilePermissions Permissions,
    MetadataResponse Metadata
);

public record ProfilePermissions(
    bool CanUpdate,
    bool CanCreate
);

public record UpsertProfileRequest(
    string CandidateName,
    string? BallotName,
    string? CPF,
    string? SocialName,
    DateTime? BirthDate,
    int? CampaignId,
    int? CandidateNumber,
    int? ElectionYear,
    int? PartyId,
    int? PositionId,
    int? StateId,
    int? MunicipalityId,
    decimal? LegalSpendingLimit
);

public record CreateCampaignRequest(
    int CandidateNumber,
    int ElectionYear,
    int PartyId,
    int PositionId,
    int? StateId,
    int? MunicipalityId,
    decimal LegalSpendingLimit
);
