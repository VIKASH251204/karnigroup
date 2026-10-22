using System.ComponentModel.DataAnnotations;

namespace RealEstate.Api.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Associate = "Associate";
}

public class User
{
    public int Id { get; set; }

    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(250)]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Admin | Associate</summary>
    [MaxLength(20)]
    public string Role { get; set; } = Roles.Associate;

    /// <summary>Active | Blocked</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public int? ParentUserId { get; set; }
    public User? ParentUser { get; set; }

    [MaxLength(300)]
    public string? ProfilePhoto { get; set; }

    [MaxLength(50)]
    public string? Designation { get; set; }

    public decimal CommissionRate { get; set; } = 5m;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Person> RegisteredPersons { get; set; } = new List<Person>();
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<Commission> Commissions { get; set; } = new List<Commission>();
    public ICollection<SiteVisit> SiteVisits { get; set; } = new List<SiteVisit>();
}
