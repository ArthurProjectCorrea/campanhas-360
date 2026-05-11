namespace Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendOtpEmailAsync(string to, string userName, string otp);
    Task SendWelcomeEmailAsync(string to, string userName, string password);
}
