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
public class UsersController(AppDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>
    /// Admin: all staff users. Associate: own team (self + reporting admin + teammates).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll([FromQuery] string? role = null, [FromQuery] string? search = null)
    {
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.Users.Include(u => u.ParentUser).AsQueryable();
        if (!isAdmin)
        {
            var myParent = await db.Users.Where(u => u.Id == me).Select(u => u.ParentUserId).FirstOrDefaultAsync();
            q = q.Where(u => u.Id == me || u.ParentUserId == me
                             || (myParent != null && (u.Id == myParent || u.ParentUserId == myParent)));
        }
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(u => u.FullName.ToLower().Contains(s) || u.Email.ToLower().Contains(s) || u.Phone.Contains(s));
        }

        var users = await q.OrderBy(u => u.FullName).ToListAsync();
        var result = new List<UserDto>();
        foreach (var u in users)
        {
            var registered = await db.Persons.CountAsync(p => p.RegisteredById == u.Id);
            var sales = await db.Sales.Where(s => s.RegisteredById == u.Id && s.Status != "Cancelled").ToListAsync();
            result.Add(Map.ToDto(u, registered, sales.Count, sales.Sum(s => s.DealAmount)));
        }
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> Get(int id)
    {
        var me = tokens.GetUserId(User);
        if (!User.IsInRole(Roles.Admin) && id != me) return Forbid();

        var u = await db.Users.Include(x => x.ParentUser).FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return NotFound();
        var registered = await db.Persons.CountAsync(p => p.RegisteredById == u.Id);
        var sales = await db.Sales.Where(s => s.RegisteredById == u.Id && s.Status != "Cancelled").ToListAsync();
        return Ok(Map.ToDto(u, registered, sales.Count, sales.Sum(s => s.DealAmount)));
    }

    /// <summary>Create staff member (admin/employee) - ADMIN ONLY.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower()))
            return BadRequest(new { message = "Email already registered" });
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters" });

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = req.Email.Trim().ToLower(),
            Phone = req.Phone.Trim(),
            PasswordHash = PasswordHasher.Hash(req.Password),
            Role = req.Role == Roles.Admin ? Roles.Admin : Roles.Associate,
            Status = "Active",
            ParentUserId = req.ParentUserId,
            CommissionRate = req.CommissionRate <= 0 ? 5 : req.CommissionRate,
            Designation = req.Designation?.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var created = await db.Users.Include(u => u.ParentUser).FirstAsync(u => u.Id == user.Id);
        return CreatedAtAction(nameof(Get), new { id = user.Id }, Map.ToDto(created));
    }

    /// <summary>Update / block / unblock user - ADMIN ONLY.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Update(int id, UpdateUserRequest req)
    {
        var user = await db.Users.Include(u => u.ParentUser).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        if (await db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower() && u.Id != id))
            return BadRequest(new { message = "Email already registered" });

        user.FullName = req.FullName.Trim();
        user.Email = req.Email.Trim().ToLower();
        user.Phone = req.Phone.Trim();
        user.Role = req.Role == Roles.Admin ? Roles.Admin : Roles.Associate;
        user.Status = req.Status == "Blocked" ? "Blocked" : "Active";
        user.ParentUserId = req.ParentUserId;
        user.CommissionRate = req.CommissionRate;
        user.Designation = req.Designation?.Trim();
        if (!string.IsNullOrWhiteSpace(req.Password))
            user.PasswordHash = PasswordHasher.Hash(req.Password);

        await db.SaveChangesAsync();
        return Ok(Map.ToDto(user));
    }

    /// <summary>Delete user - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var me = tokens.GetUserId(User);
        if (id == me) return BadRequest(new { message = "You cannot delete your own account" });

        var user = await db.Users.Include(u => u.Sales).Include(u => u.RegisteredPersons)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        if (user.Sales.Any() || user.RegisteredPersons.Any())
            return BadRequest(new { message = "User has business data. Block the user instead of deleting." });

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return Ok(new { message = "User deleted" });
    }
}
