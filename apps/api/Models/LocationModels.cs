using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace Api.Models;

public class Region
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Acronym { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;
}

public class State
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Acronym { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public Geometry? Boundary { get; set; }

    public int RegionId { get; set; }

    [ForeignKey("RegionId")]
    public Region Region { get; set; } = null!;
}

public class Mesoregion
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public int StateId { get; set; }

    [ForeignKey("StateId")]
    public State State { get; set; } = null!;
}

public class Microregion
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public int MesoregionId { get; set; }

    [ForeignKey("MesoregionId")]
    public Mesoregion Mesoregion { get; set; } = null!;
}

public class IntermediateRegion
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public int StateId { get; set; }

    [ForeignKey("StateId")]
    public State State { get; set; } = null!;
}

public class ImmediateRegion
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public int IntermediateRegionId { get; set; }

    [ForeignKey("IntermediateRegionId")]
    public IntermediateRegion IntermediateRegion { get; set; } = null!;
}

public class Municipality
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public Geometry? Boundary { get; set; }

    public int MicroregionId { get; set; }

    [ForeignKey("MicroregionId")]
    public Microregion Microregion { get; set; } = null!;

    public int ImmediateRegionId { get; set; }

    [ForeignKey("ImmediateRegionId")]
    public ImmediateRegion ImmediateRegion { get; set; } = null!;
}
