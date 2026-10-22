using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Models;

namespace RealEstate.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Person> Persons => Set<Person>();
    public DbSet<Plot> Plots => Set<Plot>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Commission> Commissions => Set<Commission>();
    public DbSet<SiteVisit> SiteVisits => Set<SiteVisit>();
    public DbSet<SiteVisitPhoto> SiteVisitPhotos => Set<SiteVisitPhoto>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.CommissionRate).HasPrecision(5, 2);
            e.HasOne(x => x.ParentUser)
             .WithMany()
             .HasForeignKey(x => x.ParentUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Person>(e =>
        {
            e.HasIndex(x => x.Phone);
            e.HasOne(x => x.RegisteredBy)
             .WithMany(x => x.RegisteredPersons)
             .HasForeignKey(x => x.RegisteredById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Plot>(e =>
        {
            e.HasIndex(x => x.PlotNo).IsUnique();
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.Property(x => x.SizeSqFt).HasPrecision(12, 2);
        });

        b.Entity<Sale>(e =>
        {
            e.Property(x => x.DealAmount).HasPrecision(18, 2);
            e.HasOne(x => x.Person)
             .WithMany(x => x.Sales)
             .HasForeignKey(x => x.PersonId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Plot)
             .WithMany(x => x.Sales)
             .HasForeignKey(x => x.PlotId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.RegisteredBy)
             .WithMany(x => x.Sales)
             .HasForeignKey(x => x.RegisteredById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Payment>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasOne(x => x.Sale)
             .WithMany(x => x.Payments)
             .HasForeignKey(x => x.SaleId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Commission>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.Rate).HasPrecision(5, 2);
            e.HasOne(x => x.User)
             .WithMany(x => x.Commissions)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Sale)
             .WithMany(x => x.Commissions)
             .HasForeignKey(x => x.SaleId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<SiteVisit>(e =>
        {
            e.HasOne(x => x.Person)
             .WithMany(x => x.SiteVisits)
             .HasForeignKey(x => x.PersonId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Plot)
             .WithMany()
             .HasForeignKey(x => x.PlotId)
             .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.CreatedBy)
             .WithMany(x => x.SiteVisits)
             .HasForeignKey(x => x.CreatedById)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<SiteVisitPhoto>(e =>
        {
            e.HasOne(x => x.SiteVisit)
             .WithMany(x => x.Photos)
             .HasForeignKey(x => x.SiteVisitId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
