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
public class PaymentsController(AppDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>Admin: all payments. Associate: payments of own sales (view-only).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<PaymentDto>>> GetAll(
        [FromQuery] string? status = null, [FromQuery] int saleId = 0,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.Payments.Include(p => p.Sale).ThenInclude(s => s!.Person)
            .Include(p => p.Sale).ThenInclude(s => s!.Plot)
            .Include(p => p.Sale).ThenInclude(s => s!.RegisteredBy)
            .AsQueryable();

        if (!isAdmin) q = q.Where(p => p.Sale!.RegisteredById == me);
        if (saleId > 0) q = q.Where(p => p.SaleId == saleId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(p => p.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(p => p.PaidAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var dtos = items.Select(p =>
        {
            var d = Map.ToDto(p);
            return d with { VerifiedByName = p.VerifiedById.HasValue ? db.Users.Find(p.VerifiedById.Value)?.FullName : null };
        }).ToList();

        return Ok(new PagedResult<PaymentDto>(dtos, total, page, pageSize));
    }

    /// <summary>Add payment record - ADMIN ONLY.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PaymentDto>> Create(PaymentRequest req)
    {
        var sale = await db.Sales.Include(s => s.Person).Include(s => s.Plot).FirstOrDefaultAsync(s => s.Id == req.SaleId);
        if (sale == null) return BadRequest(new { message = "Sale not found" });

        var payment = new Payment
        {
            SaleId = req.SaleId,
            Amount = req.Amount,
            PaymentType = req.PaymentType == "Advance" ? "Advance" : "Received",
            Method = req.Method,
            Status = "Pending",
            PaidAt = req.PaidAt,
            Notes = req.Notes
        };
        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        var created = await db.Payments.Include(p => p.Sale).ThenInclude(s => s!.Person)
            .Include(p => p.Sale).ThenInclude(s => s!.Plot).FirstAsync(p => p.Id == payment.Id);
        return CreatedAtAction(nameof(GetAll), Map.ToDto(created));
    }

    /// <summary>Approve / reject payment verification - ADMIN ONLY.</summary>
    [HttpPut("{id:int}/verify")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PaymentDto>> Verify(int id, VerifyRequest req)
    {
        var payment = await db.Payments.Include(p => p.Sale).ThenInclude(s => s!.Person)
            .Include(p => p.Sale).ThenInclude(s => s!.Plot).FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null) return NotFound();

        payment.Status = req.Status is "Approved" or "Rejected" ? req.Status : "Pending";
        payment.VerifiedById = tokens.GetUserId(User);
        payment.VerifiedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(req.Notes)) payment.Notes = req.Notes;

        await db.SaveChangesAsync();
        return Ok(Map.ToDto(payment));
    }

    /// <summary>Delete payment - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var payment = await db.Payments.FindAsync(id);
        if (payment == null) return NotFound();
        db.Payments.Remove(payment);
        await db.SaveChangesAsync();
        return Ok(new { message = "Payment deleted" });
    }
}
