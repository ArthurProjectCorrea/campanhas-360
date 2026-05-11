using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public class Permission
{
    public int Id { get; set; }

    [Required]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public ICollection<Access> Accesses { get; set; } = new List<Access>();
}
