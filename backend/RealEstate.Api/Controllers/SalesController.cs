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
public class SalesController(AppDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>Admin: all sales. Associate: only own sales (view-only).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<SaleDto>>> GetAll(
        [FromQuery] string? search = null, [FromQuery] string? status = null,
        [FromQuery] int registeredBy = 0, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.Sales.Include(s => s.Person).Include(s => s.Plot)
            .Include(s => s.Payments).Include(s => s.RegisteredBy).AsQueryable();

        if (!isAdmin) q = q.Where(s => s.RegisteredById == me);
        else if (registeredBy > 0) q = q.Where(s => s.RegisteredById == registeredBy);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(x => x.Person!.FullName.ToLower().Contains(s) || x.Plot!.PlotNo.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(x => x.SaleDate)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<SaleDto>(items.Select(Map.ToDto).ToList(), total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SaleDto>> Get(int id)
    {
        var me = tokens.GetUserId(User);
        var s = await db.Sales.Include(x => x.Person).Include(x => x.Plot)
            .Include(x => x.Payments).Include(x => x.RegisteredBy)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return NotFound();
        if (!User.IsInRole(Roles.Admin) && s.RegisteredById != me) return Forbid();
        return Ok(Map.ToDto(s));
    }

    /// <summary>Create sale - ADMIN ONLY (employee cannot create/edit sales).</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SaleDto>> Create(SaleRequest req)
    {
        var person = await db.Persons.FindAsync(req.PersonId);
        if (person == null) return BadRequest(new { message = "Client not found" });

        var plot = await db.Plots.FindAsync(req.PlotId);
        if (plot == null) return BadRequest(new { message = "Plot not found" });
        if (plot.Status == "Sold") return BadRequest(new { message = $"Plot {plot.PlotNo} is already sold" });

        var sale = new Sale
        {
            PersonId = req.PersonId,
            PlotId = req.PlotId,
            DealAmount = req.DealAmount,
            SaleDate = req.SaleDate,
            Status = string.IsNullOrWhiteSpace(req.Status) ? "InProgress" : req.Status,
            RegisteredById = tokens.GetUserId(User),
            CreatedAt = DateTime.UtcNow
        };
        plot.Status = "Sold";
        db.Sales.Add(sale);

        // auto-create commission entry for the selling member
        var seller = await db.Users.FindAsync(sale.RegisteredById);
        db.Commissions.Add(new Commission
        {
            UserId = sale.RegisteredById,
            Sale = sale,
            Rate = seller?.CommissionRate ?? 5,
            Amount = Math.Round(req.DealAmount * (seller?.CommissionRate ?? 5) / 100m, 2),
            Status = "Pending",
            RequestedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();

        var created = await db.Sales.Include(x => x.Person).Include(x => x.Plot)
            .Include(x => x.Payments).Include(x => x.RegisteredBy)
            .FirstAsync(x => x.Id == sale.Id);
        return CreatedAtAction(nameof(Get), new { id = sale.Id }, Map.ToDto(created));
    }

    /// <summary>Update sale - ADMIN ONLY.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SaleDto>> Update(int id, SaleRequest req)
    {
        var sale = await db.Sales.Include(x => x.Plot).FirstOrDefaultAsync(x => x.Id == id);
        if (sale == null) return NotFound();

        var oldPlot = sale.Plot!;
        var newPlot = await db.Plots.FindAsync(req.PlotId);
        if (newPlot == null) return BadRequest(new { message = "Plot not found" });

        sale.PersonId = req.PersonId;
        sale.DealAmount = req.DealAmount;
        sale.SaleDate = req.SaleDate;
        if (!string.IsNullOrWhiteSpace(req.Status)) sale.Status = req.Status;

        if (sale.PlotId != req.PlotId)
        {
            oldPlot.Status = "Available";
            newPlot.Status = "Sold";
            sale.PlotId = req.PlotId;
        }
        if (sale.Status == "Cancelled")
            oldPlot.Status = "Available";

        await db.SaveChangesAsync();

        var updated = await db.Sales.Include(x => x.Person).Include(x => x.Plot)
            .Include(x => x.Payments).Include(x => x.RegisteredBy)
            .FirstAsync(x => x.Id == id);
        return Ok(Map.ToDto(updated));
    }

    /// <summary>Delete sale - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var sale = await db.Sales.Include(x => x.Plot).Include(x => x.Commissions)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (sale == null) return NotFound();

        if (sale.Plot != null) sale.Plot.Status = "Available";
        db.Commissions.RemoveRange(sale.Commissions);
        db.Sales.Remove(sale);
        await db.SaveChangesAsync();
        return Ok(new { message = "Sale deleted" });
    }
}
