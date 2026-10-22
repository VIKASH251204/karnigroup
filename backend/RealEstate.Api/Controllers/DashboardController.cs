using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstate.Api.Dtos;
using RealEstate.Api.Services;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(DashboardService dash, TokenService tokens) : ControllerBase
{
    /// <summary>Associate dashboard - own data only (limited panel).</summary>
    [HttpGet("associate")]
    public async Task<ActionResult<EmployeeDashboardDto>> Employee(
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var (f, t) = ResolveRange(from, to);
        return Ok(await dash.GetEmployeeDashboardAsync(tokens.GetUserId(User), f, t));
    }

    /// <summary>Admin dashboard - company-wide (full panel).</summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminDashboardDto>> Admin(
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var (f, t) = ResolveRange(from, to);
        return Ok(await dash.GetAdminDashboardAsync(f, t));
    }

    private static (DateTime from, DateTime to) ResolveRange(DateTime? from, DateTime? to)
    {
        var year = DateTime.UtcNow.Year;
        return (from ?? new DateTime(year, 1, 1), to ?? new DateTime(year, 12, 31, 23, 59, 59));
    }
}
