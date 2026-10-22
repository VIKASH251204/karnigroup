using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Data;
using RealEstate.Api.Dtos;
using RealEstate.Api.Models;
using RealEstate.Api.Services;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlotsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PlotDto>>> GetAll([FromQuery] string? search = null, [FromQuery] string? status = null)
    {
        var q = db.Plots.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(p => p.PlotNo.ToLower().Contains(s) || p.Project.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(p => p.Status == status);
        var items = await q.OrderBy(p => p.PlotNo).ToListAsync();
        return Ok(items.Select(Map.ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlotDto>> Get(int id)
    {
        var p = await db.Plots.FindAsync(id);
        return p == null ? NotFound() : Ok(Map.ToDto(p));
    }

    /// <summary>Create plot - ADMIN ONLY.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PlotDto>> Create(PlotRequest req)
    {
        if (await db.Plots.AnyAsync(p => p.PlotNo == req.PlotNo))
            return BadRequest(new { message = $"Plot number '{req.PlotNo}' already exists" });

        var plot = new Plot
        {
            PlotNo = req.PlotNo.Trim(),
            Project = req.Project.Trim(),
            Block = req.Block?.Trim(),
            SizeSqFt = req.SizeSqFt,
            Price = req.Price,
            Status = string.IsNullOrWhiteSpace(req.Status) ? "Available" : req.Status,
            CreatedAt = DateTime.UtcNow
        };
        db.Plots.Add(plot);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = plot.Id }, Map.ToDto(plot));
    }

    /// <summary>Update plot / pricing - ADMIN ONLY.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PlotDto>> Update(int id, PlotRequest req)
    {
        var plot = await db.Plots.FindAsync(id);
        if (plot == null) return NotFound();

        if (await db.Plots.AnyAsync(p => p.PlotNo == req.PlotNo && p.Id != id))
            return BadRequest(new { message = $"Plot number '{req.PlotNo}' already exists" });

        plot.PlotNo = req.PlotNo.Trim();
        plot.Project = req.Project.Trim();
        plot.Block = req.Block?.Trim();
        plot.SizeSqFt = req.SizeSqFt;
        plot.Price = req.Price;
        if (!string.IsNullOrWhiteSpace(req.Status)) plot.Status = req.Status;

        await db.SaveChangesAsync();
        return Ok(Map.ToDto(plot));
    }

    /// <summary>Delete plot - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var plot = await db.Plots.Include(p => p.Sales).FirstOrDefaultAsync(p => p.Id == id);
        if (plot == null) return NotFound();
        if (plot.Sales.Any()) return BadRequest(new { message = "Cannot delete - plot has sale history. Mark Blocked instead." });

        db.Plots.Remove(plot);
        await db.SaveChangesAsync();
        return Ok(new { message = "Plot deleted" });
    }
}
