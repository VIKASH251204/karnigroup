using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public class Payment
{
    public int Id { get; set; }

    public int SaleId { get; set; }
    public Sale? Sale { get; set; }

    public decimal Amount { get; set; }

    /// <summary>Received | Advance</summary>
    [MaxLength(20)]
    public string PaymentType { get; set; } = "Received";

    /// <summary>Cash | UPI | BankTransfer | Cheque</summary>
    [MaxLength(20)]
    public string Method { get; set; } = "BankTransfer";

    /// <summary>Pending | Approved | Rejected</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    [MaxLength(300)]
    public string? Notes { get; set; }

    public int? VerifiedById { get; set; }
    public DateTime? VerifiedAt { get; set; }
}
