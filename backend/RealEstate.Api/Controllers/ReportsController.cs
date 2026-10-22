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
public class ReportsController(DashboardService dash, AppDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>Sales report. Admin: company-wide. Associate: own data only.</summary>
    [HttpGet("sales")]
    public async Task<ActionResult<SalesReportDto>> Sales([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var year = DateTime.UtcNow.Year;
        var f = from ?? new DateTime(year, 1, 1);
        var t = to ?? new DateTime(year, 12, 31, 23, 59, 59);
        var me = tokens.GetUserId(User);
        var restrict = User.IsInRole(Roles.Admin) ? null : (int?)me;
        return Ok(await dash.GetSalesReportAsync(f, t, restrict));
    }

    /// <summary>Commission report summary.</summary>
    [HttpGet("commissions")]
    public async Task<ActionResult<object>> Commissions([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var year = DateTime.UtcNow.Year;
        var f = from ?? new DateTime(year, 1, 1);
        var t = to ?? new DateTime(year, 12, 31, 23, 59, 59);
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.Commissions.Include(c => c.User)
            .Where(c => c.RequestedAt >= f && c.RequestedAt <= t);
        if (!isAdmin) q = q.Where(c => c.UserId == me);

        var all = await q.ToListAsync();
        var byUser = all.GroupBy(c => c.User!.FullName)
            .Select(g => new { Name = g.Key, Total = g.Sum(x => x.Amount), Pending = g.Where(x => x.Status == "Pending").Sum(x => x.Amount), Paid = g.Where(x => x.Status == "Paid").Sum(x => x.Amount) })
            .OrderByDescending(x => x.Total)
            .ToList();

        return Ok(new
        {
            from = f,
            to = t,
            total = all.Sum(c => c.Amount),
            pending = all.Where(c => c.Status == "Pending").Sum(c => c.Amount),
            approved = all.Where(c => c.Status == "Approved").Sum(c => c.Amount),
            paid = all.Where(c => c.Status == "Paid").Sum(c => c.Amount),
            byUser
        });
    }
}
