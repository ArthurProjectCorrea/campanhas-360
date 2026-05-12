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
/// <param name="Permissions">Lista de permissões e telas do usuário.</param>
public record SignInResponse(
    string Token,
    Guid UserId,
    string UserName,
    Guid ClientId,
    string ClientDomain,
    Guid AccessProfileId,
    string AccessProfileName,
    List<UserPermissionDto> Permissions
);

public record UserPermissionDto(string Screen, string Key, string? Icon = null, string? Title = null);

/// <summary>
/// Solicitação de início de recuperação de senha.
/// </summary>
/// <param name="Email">E-mail do usuário.</param>
public record ForgotPasswordRequest(string Email);

/// <summary>
/// Validação do código OTP enviado por e-mail.
/// </summary>
/// <param name="Email">E-mail do usuário.</param>
/// <param name="Otp">Código de 6 dígitos.</param>
public record VerifyOtpRequest(string Email, string Otp);

/// <summary>
/// Redefinição final da senha.
/// </summary>
/// <param name="ResetToken">Token temporário validado.</param>
/// <param name="NewPassword">Nova senha do usuário.</param>
public record ResetPasswordRequest(string ResetToken, string NewPassword);
