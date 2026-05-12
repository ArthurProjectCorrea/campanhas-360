using Api.Data;
using Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers;

[ApiController]
[Route("metadata")]
public class MetadataController : BaseApiController
{
    private readonly ApplicationDbContext _context;

    public MetadataController(ApplicationDbContext context, IConnectionMultiplexer redis) : base(context, redis)
    {
        _context = context;
    }

    [HttpGet("count")]
    public async Task<ActionResult<int>> GetMunicipalityCount()
    {
        return Ok(await _context.Municipalities.CountAsync());
    }

    /// <summary>
    /// Retorna a lista de municípios filtrada por estado.
    /// </summary>
    [HttpGet("municipalities")]
    public async Task<ActionResult<IEnumerable<MunicipalityMetadata>>> GetMunicipalities([FromQuery] int stateId)
    {
        var municipalities = await _context.Municipalities
            .Where(m => m.ImmediateRegion.IntermediateRegion.StateId == stateId ||
                        m.Microregion.Mesoregion.StateId == stateId)
            .OrderBy(m => m.Name)
            .Select(m => new MunicipalityMetadata(m.Id, m.Name))
            .ToListAsync();

        return Ok(municipalities);
    }
}
