using System;
using System.Collections.Generic;

namespace Api.DTOs;

public class AccessProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<AccessRequest> Accesses { get; set; } = new();
}

public class AccessRequest
{
    public int ScreenId { get; set; }
    public int PermissionId { get; set; }
}

public class AccessProfileResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AccessResponse> Accesses { get; set; } = new();
}

public class AccessResponse
{
    public int ScreenId { get; set; }
    public string ScreenKey { get; set; } = string.Empty;
    public int PermissionId { get; set; }
    public string PermissionKey { get; set; } = string.Empty;
}
