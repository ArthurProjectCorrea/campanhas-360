namespace Api.DTOs;

/// <summary>
/// Objeto de requisição para autenticação.
/// </summary>
/// <param name="Email">E-mail do usuário.</param>
/// <param name="Password">Senha do usuário.</param>
public record SignInRequest(string Email, string Password);

/// <summary>
/// Resposta de autenticação bem-sucedida.
/// </summary>
/// <param name="Token">Token de sessão (GUID).</param>
/// <param name="UserId">ID único do usuário.</param>
/// <param name="UserName">Nome completo do usuário.</param>
/// <param name="ClientId">ID do cliente (inquilino).</param>
/// <param name="ClientDomain">Domínio/Slug do cliente para rotas.</param>
/// <param name="AccessProfileId">ID do perfil de acesso.</param>
/// <param name="AccessProfileName">Nome do perfil de acesso.</param>
public record SignInResponse(
    string Token,
    Guid UserId,
    string UserName,
    Guid ClientId,
    string ClientDomain,
    Guid AccessProfileId,
    string AccessProfileName
);
