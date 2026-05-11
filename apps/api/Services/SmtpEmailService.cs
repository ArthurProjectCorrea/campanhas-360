using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var host = _configuration["MAIL_HOST"] ?? "localhost";
        var port = int.Parse(_configuration["MAIL_PORT"] ?? "1025");
        var user = _configuration["MAIL_USER"];
        var pass = _configuration["MAIL_PASS"];

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Campanhas 360", "no-reply@campanhas360.com"));
        message.To.Add(new MailboxAddress("", to));
        message.Subject = subject;

        message.Body = new TextPart("html")
        {
            Text = body
        };

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.None);

            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await client.AuthenticateAsync(user, pass);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar e-mail para {To}", to);
            // Em dev, não vamos travar o fluxo se o e-mail falhar, mas vamos logar.
        }
    }

    public async Task SendOtpEmailAsync(string to, string userName, string otp)
    {
        var subject = $"{otp} é o seu código de recuperação";
        var body = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Olá, {userName}!</h2>
                <p>Você solicitou a recuperação de senha no <strong>Campanhas 360</strong>.</p>
                <p>Use o código abaixo para prosseguir:</p>
                <div style='background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;'>
                    {otp}
                </div>
                <p>Este código expira em <strong>5 minutos</strong>.</p>
                <hr />
                <p style='font-size: 12px; color: #666;'>Se você não solicitou esta alteração, ignore este e-mail.</p>
            </div>";
        await SendEmailAsync(to, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string to, string userName, string password)
    {
        var subject = "Bem-vindo ao Campanhas 360!";
        var body = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #2563eb;'>Olá, {userName}!</h2>
                <p>Sua conta no <strong>Campanhas 360</strong> foi criada com sucesso.</p>
                <p>Abaixo estão suas credenciais de acesso:</p>
                <div style='background: #f4f4f4; padding: 20px; border-radius: 8px;'>
                    <p style='margin: 5px 0;'><strong>Login:</strong> {to}</p>
                    <p style='margin: 5px 0;'><strong>Senha Temporária:</strong> <span style='font-family: monospace; background: #fff; padding: 2px 4px; border: 1px solid #ddd;'>{password}</span></p>
                </div>
                <p style='margin-top: 20px;'>Recomendamos que você altere sua senha no seu primeiro acesso.</p>
                <p>Acesse o sistema em: <a href='https://campanhas360.com' style='color: #2563eb;'>campanhas360.com</a></p>
                <hr />
                <p style='font-size: 12px; color: #666;'>Se você não reconhece este cadastro, entre em contato com nosso suporte.</p>
            </div>";

        await SendEmailAsync(to, subject, body);
    }
}
