using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models;

public class Candidate
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string? BallotName { get; set; }

    public string? CPF { get; set; }

    public string? SocialName { get; set; }

    public DateTime? BirthDate { get; set; }

    [Required]
    public Guid ClientId { get; set; }

    [ForeignKey("ClientId")]
    public Client Client { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
}

public class Campaign
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int CandidateId { get; set; }

    [ForeignKey("CandidateId")]
    public Candidate Candidate { get; set; } = null!;

    [Required]
    public int PositionId { get; set; }

    [ForeignKey("PositionId")]
    public Position Position { get; set; } = null!;

    public int? StateId { get; set; }
    [ForeignKey("StateId")]
    public State? State { get; set; }

    public int? MunicipalityId { get; set; }
    [ForeignKey("MunicipalityId")]
    public Municipality? Municipality { get; set; }

    [Required]
    public int PartyId { get; set; }

    [ForeignKey("PartyId")]
    public Party Party { get; set; } = null!;

    public int CandidateNumber { get; set; }

    public int ElectionYear { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal LegalSpendingLimit { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public Guid ClientId { get; set; }

    [ForeignKey("ClientId")]
    public Client Client { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
