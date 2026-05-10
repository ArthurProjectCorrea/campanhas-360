using Microsoft.AspNetCore.Identity;
using System;

namespace Api.Models;

public class ApplicationUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    public Guid AccessProfileId { get; set; }
    public AccessProfile AccessProfile { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
