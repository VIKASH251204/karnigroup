using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public class SiteVisit
{
    public int Id { get; set; }

    public int PersonId { get; set; }
    public Person? Person { get; set; }

    public int? PlotId { get; set; }
    public Plot? Plot { get; set; }

    public DateTime VisitDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    /// <summary>Scheduled | Completed | Cancelled</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Completed";

    public int CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SiteVisitPhoto> Photos { get; set; } = new List<SiteVisitPhoto>();
}
