using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public class Commission
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int? SaleId { get; set; }
    public Sale? Sale { get; set; }

    public decimal Amount { get; set; }
    public decimal Rate { get; set; }

    /// <summary>Pending | Approved | Paid</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ApprovedAt { get; set; }
    public int? ApprovedById { get; set; }
}
