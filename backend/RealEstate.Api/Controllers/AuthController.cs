using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Data;
using RealEstate.Api.Dtos;
using RealEstate.Api.Services;

namespace RealEstate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, TokenService tokens) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required" });

        var user = await db.Users.Include(u => u.ParentUser)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == req.Email.ToLower());

        if (user == null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password" });

        if (user.Status == "Blocked")
            return Unauthorized(new { message = "Your account has been blocked. Contact administrator." });

        var token = tokens.CreateToken(user);
        return Ok(new LoginResponse(token, await BuildUserDtoAsync(user)));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = tokens.GetUserId(User);
        var user = await db.Users.Include(u => u.ParentUser).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound();
        return Ok(await BuildUserDtoAsync(user));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        var userId = tokens.GetUserId(User);
        var user = await db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!PasswordHasher.Verify(req.OldPassword, user.PasswordHash))
            return BadRequest(new { message = "Old password is incorrect" });
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters" });

        user.PasswordHash = PasswordHasher.Hash(req.NewPassword);
        await db.SaveChangesAsync();
        return Ok(new { message = "Password changed successfully" });
    }

    private async Task<UserDto> BuildUserDtoAsync(Models.User user)
    {
        var registered = await db.Persons.CountAsync(p => p.RegisteredById == user.Id);
        var sales = await db.Sales.Where(s => s.RegisteredById == user.Id && s.Status != "Cancelled").ToListAsync();
        return Map.ToDto(user, registered, sales.Count, sales.Sum(s => s.DealAmount));
    }
}
