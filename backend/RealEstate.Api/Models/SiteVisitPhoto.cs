using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public class SiteVisitPhoto
{
    public int Id { get; set; }

    public int SiteVisitId { get; set; }
    public SiteVisit? SiteVisit { get; set; }

    [MaxLength(300)]
    public string FilePath { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Caption { get; set; }

    public int UploadedById { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
