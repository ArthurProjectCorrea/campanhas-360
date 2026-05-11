using System;

namespace Api.DTOs;

public record UserResponse(
    Guid Id,
    string Name,
    string Email,
    Guid AccessProfileId,
    string AccessProfileName,
    bool IsActive,
    DateTime CreatedAt
);

public record UpsertUserRequest(
    string Name,
    string Email,
    Guid AccessProfileId,
    bool IsActive
);
