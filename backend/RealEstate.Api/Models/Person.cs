using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

/// <summary>
/// A 3rd person (client / lead) registered by an admin or employee.
/// </summary>
public class Person
{
    public int Id { get; set; }

    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? IdProofNumber { get; set; }

    /// <summary>Active | Inactive</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    [MaxLength(500)]
    public string? Notes { get; set; }

    public int RegisteredById { get; set; }
    public User? RegisteredBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
