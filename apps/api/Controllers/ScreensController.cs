using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("screens")]
public class ScreensController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ScreensController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var screens = await _context.Screens
            .OrderBy(s => s.Id)
            .ToListAsync();
        return Ok(screens);
    }
}
