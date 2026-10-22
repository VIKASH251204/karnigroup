using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public class Sale
{
    public int Id { get; set; }

    public int PersonId { get; set; }
    public Person? Person { get; set; }

    public int PlotId { get; set; }
    public Plot? Plot { get; set; }

    public decimal DealAmount { get; set; }

    public DateTime SaleDate { get; set; }

    /// <summary>InProgress | Completed | Cancelled</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "InProgress";

    public int RegisteredById { get; set; }
    public User? RegisteredBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Commission> Commissions { get; set; } = new List<Commission>();
}
