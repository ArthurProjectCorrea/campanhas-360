using System;
using System.Collections.Generic;

namespace Api.Models;

public class Client
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<AccessProfile> AccessProfiles { get; set; } = new List<AccessProfile>();
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}
