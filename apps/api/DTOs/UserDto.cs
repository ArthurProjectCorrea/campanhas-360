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

/// <summary>
/// Resposta com os dados detalhados do usuário logado.
/// </summary>
/// <param name="Name">Nome completo.</param>
/// <param name="Email">E-mail institucional.</param>
/// <param name="AccessProfileName">Nome do perfil de acesso (cargo).</param>
public record UserMeResponse(
    string Name,
    string Email,
    string AccessProfileName
);

/// <summary>
/// Requisição para atualização dos dados de perfil do usuário logado.
/// </summary>
/// <param name="Name">Novo nome completo.</param>
/// <param name="Email">Novo e-mail.</param>
public record UpdateProfileRequest(
    string Name,
    string Email
);
