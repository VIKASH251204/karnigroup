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
public class CommissionsController(AppDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>Admin: all commissions. Associate: own commissions (view-only).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<CommissionDto>>> GetAll(
        [FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.Commissions.Include(c => c.User)
            .Include(c => c.Sale).ThenInclude(s => s!.Plot)
            .Include(c => c.Sale).ThenInclude(s => s!.Person)
            .AsQueryable();

        if (!isAdmin) q = q.Where(c => c.UserId == me);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(c => c.RequestedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<CommissionDto>(items.Select(Map.ToDto).ToList(), total, page, pageSize));
    }

    /// <summary>Create commission entry - ADMIN ONLY.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CommissionDto>> Create(CommissionRequest req)
    {
        var user = await db.Users.FindAsync(req.UserId);
        if (user == null) return BadRequest(new { message = "User not found" });

        var c = new Commission
        {
            UserId = req.UserId,
            SaleId = req.SaleId,
            Amount = req.Amount,
            Rate = req.Rate,
            Status = "Pending",
            RequestedAt = DateTime.UtcNow
        };
        db.Commissions.Add(c);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), Map.ToDto(c));
    }

    /// <summary>Approve commission - ADMIN ONLY.</summary>
    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CommissionDto>> Approve(int id)
    {
        var c = await db.Commissions.Include(x => x.User).Include(x => x.Sale).ThenInclude(s => s!.Plot)
            .Include(x => x.Sale).ThenInclude(s => s!.Person)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();

        c.Status = "Approved";
        c.ApprovedAt = DateTime.UtcNow;
        c.ApprovedById = tokens.GetUserId(User);
        await db.SaveChangesAsync();
        return Ok(Map.ToDto(c));
    }

    /// <summary>Mark commission as paid - ADMIN ONLY.</summary>
    [HttpPut("{id:int}/pay")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CommissionDto>> MarkPaid(int id)
    {
        var c = await db.Commissions.Include(x => x.User).Include(x => x.Sale).ThenInclude(s => s!.Plot)
            .Include(x => x.Sale).ThenInclude(s => s!.Person)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return NotFound();

        c.Status = "Paid";
        c.ApprovedAt ??= DateTime.UtcNow;
        c.ApprovedById = tokens.GetUserId(User);
        await db.SaveChangesAsync();
        return Ok(Map.ToDto(c));
    }

    /// <summary>Reject commission - ADMIN ONLY.</summary>
    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CommissionDto>> Reject(int id)
    {
        var c = await db.Commissions.FindAsync(id);
        if (c == null) return NotFound();
        c.Status = "Rejected";
        await db.SaveChangesAsync();
        return Ok(Map.ToDto(c));
    }
}
