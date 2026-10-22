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
public class PersonsController(AppDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>
    /// view=team    -> persons registered by me (my team / recruits)
    /// view=clients -> persons who bought plots from me (my clients / buyers)
    /// view=all     -> Admin: all persons. Associate: own registrations.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<PersonDto>>> GetAll(
        [FromQuery] string? search = null, [FromQuery] string? status = null,
        [FromQuery] int registeredBy = 0, [FromQuery] string? view = null,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.Persons.Include(p => p.RegisteredBy).Include(p => p.Sales).AsQueryable();

        if (view == "team")
        {
            // Team = people I have registered (Admin can also filter a member's team via registeredBy)
            var owner = (isAdmin && registeredBy > 0) ? registeredBy : me;
            q = q.Where(p => p.RegisteredById == owner);
        }
        else if (view == "clients")
        {
            // Clients = people who bought plots through me (Admin sees all buyers)
            if (isAdmin && registeredBy > 0)
                q = q.Where(p => p.Sales.Any(s => s.RegisteredById == registeredBy && s.Status != "Cancelled"));
            else if (isAdmin)
                q = q.Where(p => p.Sales.Any(s => s.Status != "Cancelled"));
            else
                q = q.Where(p => p.Sales.Any(s => s.RegisteredById == me && s.Status != "Cancelled"));
        }
        else
        {
            if (!isAdmin) q = q.Where(p => p.RegisteredById == me);
            else if (registeredBy > 0) q = q.Where(p => p.RegisteredById == registeredBy);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(p => p.FullName.ToLower().Contains(s) || p.Phone.Contains(s)
                             || (p.Email != null && p.Email.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(p => p.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<PersonDto>(items.Select(Map.ToDto).ToList(), total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PersonDto>> Get(int id)
    {
        var me = tokens.GetUserId(User);
        var p = await db.Persons.Include(x => x.RegisteredBy).Include(x => x.Sales)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        if (!User.IsInRole(Roles.Admin) && p.RegisteredById != me) return Forbid();
        return Ok(Map.ToDto(p));
    }

    /// <summary>Register a new 3rd person. ALLOWED for both Admin and Associate.</summary>
    [HttpPost]
    public async Task<ActionResult<PersonDto>> Create(PersonRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) || string.IsNullOrWhiteSpace(req.Phone))
            return BadRequest(new { message = "Name and phone are required" });

        var person = new Person
        {
            FullName = req.FullName.Trim(),
            Phone = req.Phone.Trim(),
            Email = req.Email?.Trim(),
            Address = req.Address?.Trim(),
            IdProofNumber = req.IdProofNumber?.Trim(),
            Notes = req.Notes?.Trim(),
            Status = string.IsNullOrWhiteSpace(req.Status) ? "Active" : req.Status,
            RegisteredById = tokens.GetUserId(User),
            CreatedAt = DateTime.UtcNow
        };
        db.Persons.Add(person);
        await db.SaveChangesAsync();

        var created = await db.Persons.Include(p => p.RegisteredBy).Include(p => p.Sales)
            .FirstAsync(p => p.Id == person.Id);
        return CreatedAtAction(nameof(Get), new { id = person.Id }, Map.ToDto(created));
    }

    /// <summary>Update person - ADMIN ONLY (employee has view-only access).</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PersonDto>> Update(int id, PersonRequest req)
    {
        var p = await db.Persons.Include(x => x.RegisteredBy).Include(x => x.Sales).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();

        p.FullName = req.FullName.Trim();
        p.Phone = req.Phone.Trim();
        p.Email = req.Email?.Trim();
        p.Address = req.Address?.Trim();
        p.IdProofNumber = req.IdProofNumber?.Trim();
        p.Notes = req.Notes?.Trim();
        if (!string.IsNullOrWhiteSpace(req.Status)) p.Status = req.Status;

        await db.SaveChangesAsync();
        return Ok(Map.ToDto(p));
    }

    /// <summary>Delete person - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await db.Persons.Include(x => x.Sales).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return NotFound();
        if (p.Sales.Any()) return BadRequest(new { message = "Cannot delete - person has linked sales. Mark Inactive instead." });

        db.Persons.Remove(p);
        await db.SaveChangesAsync();
        return Ok(new { message = "Person deleted" });
    }
}
