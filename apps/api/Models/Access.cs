using System;

namespace Api.Models;

public class Access
{
    public Guid AccessProfileId { get; set; }
    public AccessProfile AccessProfile { get; set; } = null!;

    public int ScreenId { get; set; }
    public Screen Screen { get; set; } = null!;

    public int PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}
