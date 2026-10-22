using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public class Plot
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string PlotNo { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Project { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Block { get; set; }

    public decimal SizeSqFt { get; set; }
    public decimal Price { get; set; }

    /// <summary>Available | Sold | Blocked</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Available";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
