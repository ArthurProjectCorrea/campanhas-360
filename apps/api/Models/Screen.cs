using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public class Screen
{
    public int Id { get; set; }

    [Required]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
    public string? Sidebar { get; set; }
    public string? Icon { get; set; }

    public ICollection<Access> Accesses { get; set; } = new List<Access>();
}
