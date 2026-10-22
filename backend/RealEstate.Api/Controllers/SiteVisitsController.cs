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
public class SiteVisitsController(AppDbContext db, TokenService tokens, FileStorageService fileStorage) : ControllerBase
{
    /// <summary>Admin: all site visits. Associate: own site visits.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<SiteVisitDto>>> GetAll(
        [FromQuery] string? search = null, [FromQuery] string? status = null,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var me = tokens.GetUserId(User);
        var isAdmin = User.IsInRole(Roles.Admin);

        var q = db.SiteVisits
            .Include(v => v.Person).Include(v => v.Plot).Include(v => v.CreatedBy)
            .Include(v => v.Photos)
            .AsQueryable();

        if (!isAdmin) q = q.Where(v => v.CreatedById == me);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(v => v.Person!.FullName.ToLower().Contains(s) || (v.Plot != null && v.Plot.PlotNo.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(v => v.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(v => v.VisitDate)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<SiteVisitDto>(items.Select(Map.ToDto).ToList(), total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SiteVisitDto>> Get(int id)
    {
        var me = tokens.GetUserId(User);
        var v = await db.SiteVisits
            .Include(x => x.Person).Include(x => x.Plot).Include(x => x.CreatedBy).Include(x => x.Photos)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (v == null) return NotFound();
        if (!User.IsInRole(Roles.Admin) && v.CreatedById != me) return Forbid();
        return Ok(Map.ToDto(v));
    }

    /// <summary>Create site visit - ALLOWED for both Admin and Associate.</summary>
    [HttpPost]
    public async Task<ActionResult<SiteVisitDto>> Create(SiteVisitRequest req)
    {
        var person = await db.Persons.FindAsync(req.PersonId);
        if (person == null) return BadRequest(new { message = "Client not found" });

        var visit = new SiteVisit
        {
            PersonId = req.PersonId,
            PlotId = req.PlotId,
            VisitDate = req.VisitDate,
            Notes = req.Notes?.Trim(),
            Status = string.IsNullOrWhiteSpace(req.Status) ? "Completed" : req.Status,
            CreatedById = tokens.GetUserId(User),
            CreatedAt = DateTime.UtcNow
        };
        db.SiteVisits.Add(visit);
        await db.SaveChangesAsync();

        var created = await db.SiteVisits
            .Include(x => x.Person).Include(x => x.Plot).Include(x => x.CreatedBy).Include(x => x.Photos)
            .FirstAsync(x => x.Id == visit.Id);
        return CreatedAtAction(nameof(Get), new { id = visit.Id }, Map.ToDto(created));
    }

    /// <summary>
    /// Upload site-visit photos (multipart/form-data) - ALLOWED for both Admin and Associate.
    /// Fields: files (IFormFile[]), caption (string, optional).
    /// </summary>
    [HttpPost("{id:int}/photos")]
    public async Task<ActionResult<SiteVisitDto>> UploadPhotos(int id, List<IFormFile> files, [FromForm] string? caption = null)
    {
        var me = tokens.GetUserId(User);
        var visit = await db.SiteVisits.Include(v => v.Photos).FirstOrDefaultAsync(v => v.Id == id);
        if (visit == null) return NotFound();
        if (!User.IsInRole(Roles.Admin) && visit.CreatedById != me) return Forbid();

        if (files == null || files.Count == 0)
            return BadRequest(new { message = "No files uploaded" });

        foreach (var file in files)
        {
            try
            {
                var path = await fileStorage.SaveSiteVisitPhotoAsync(file);
                visit.Photos.Add(new SiteVisitPhoto
                {
                    FilePath = path,
                    Caption = caption,
                    UploadedById = me,
                    UploadedAt = DateTime.UtcNow
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        await db.SaveChangesAsync();

        var updated = await db.SiteVisits
            .Include(x => x.Person).Include(x => x.Plot).Include(x => x.CreatedBy).Include(x => x.Photos)
            .FirstAsync(x => x.Id == id);
        return Ok(Map.ToDto(updated));
    }

    /// <summary>Update visit details - ADMIN ONLY (employee can only add visit + photos).</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SiteVisitDto>> Update(int id, SiteVisitRequest req)
    {
        var visit = await db.SiteVisits.Include(v => v.Photos).FirstOrDefaultAsync(v => v.Id == id);
        if (visit == null) return NotFound();

        visit.PersonId = req.PersonId;
        visit.PlotId = req.PlotId;
        visit.VisitDate = req.VisitDate;
        visit.Notes = req.Notes?.Trim();
        if (!string.IsNullOrWhiteSpace(req.Status)) visit.Status = req.Status;

        await db.SaveChangesAsync();
        var updated = await db.SiteVisits
            .Include(x => x.Person).Include(x => x.Plot).Include(x => x.CreatedBy).Include(x => x.Photos)
            .FirstAsync(x => x.Id == id);
        return Ok(Map.ToDto(updated));
    }

    /// <summary>Delete photo - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}/photos/{photoId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePhoto(int id, int photoId)
    {
        var photo = await db.SiteVisitPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.SiteVisitId == id);
        if (photo == null) return NotFound();

        fileStorage.DeleteSiteVisitPhoto(photo.FilePath);
        db.SiteVisitPhotos.Remove(photo);
        await db.SaveChangesAsync();
        return Ok(new { message = "Photo deleted" });
    }

    /// <summary>Delete site visit - ADMIN ONLY.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var visit = await db.SiteVisits.Include(v => v.Photos).FirstOrDefaultAsync(v => v.Id == id);
        if (visit == null) return NotFound();

        foreach (var p in visit.Photos) fileStorage.DeleteSiteVisitPhoto(p.FilePath);
        db.SiteVisits.Remove(visit);
        await db.SaveChangesAsync();
        return Ok(new { message = "Site visit deleted" });
    }
}
