using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Data;
using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Services;

public class DashboardService(AppDbContext db)
{
    private static readonly string[] MonthNames =
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    private static PaymentStatusDto BuildPaymentStatus(IEnumerable<Sale> sales)
    {
        var list = sales.ToList();
        var received = list.SelectMany(s => s.Payments).Where(p => p.Status == "Approved").Sum(p => p.Amount);
        var advance = list.SelectMany(s => s.Payments)
                          .Where(p => p.PaymentType == "Advance" && p.Status == "Pending")
                          .Sum(p => p.Amount);
        var pending = list.Sum(s => Math.Max(0, s.DealAmount - s.Payments.Where(p => p.Status == "Approved").Sum(p => p.Amount)));
        var denom = received + pending;
        var pct = denom <= 0 ? 0 : Math.Round(received / denom * 100, 0);
        return new PaymentStatusDto(received, pending, advance, pct);
    }

    private static List<MonthlyPoint> BuildMonthly(IEnumerable<Sale> sales, DateTime from, DateTime to)
    {
        var filtered = sales
            .Where(s => s.SaleDate >= from && s.SaleDate <= to && s.Status != "Cancelled")
            .ToList();

        return Enumerable.Range(1, 12).Select(m =>
        {
            var monthSales = filtered.Where(s => s.SaleDate.Month == m).ToList();
            return new MonthlyPoint(
                MonthNames[m - 1],
                monthSales.Count,
                monthSales.Sum(s => s.DealAmount));
        }).ToList();
    }

    public async Task<EmployeeDashboardDto> GetEmployeeDashboardAsync(int userId, DateTime from, DateTime to)
    {
        var user = await db.Users.FindAsync(userId);

        var mySalesQuery = db.Sales
            .Include(s => s.Person).Include(s => s.Plot)
            .Include(s => s.Payments).Include(s => s.RegisteredBy)
            .Where(s => s.RegisteredById == userId);

        var mySales = await mySalesQuery.ToListAsync();
        var windowSales = mySales.Where(s => s.SaleDate >= from && s.SaleDate <= to && s.Status != "Cancelled").ToList();

        // Rank all active users by revenue in window
        var userRevenue = await db.Sales
            .Where(s => s.Status != "Cancelled" && s.SaleDate >= from && s.SaleDate <= to)
            .GroupBy(s => s.RegisteredById)
            .Select(g => new { UserId = g.Key, Revenue = g.Sum(x => (double)x.DealAmount) })
            .ToListAsync();

        var totalUsers = await db.Users.CountAsync(u => u.Status == "Active");
        var ranked = userRevenue.OrderByDescending(x => x.Revenue).ToList();
        var myRank = ranked.FindIndex(x => x.UserId == userId) + 1;
        if (myRank == 0) myRank = totalUsers; // no sales yet -> last place

        var myCommissions = await db.Commissions.Where(c => c.UserId == userId).ToListAsync();

        var myPersons = await db.Persons
            .Include(p => p.RegisteredBy).Include(p => p.Sales)
            .Where(p => p.RegisteredById == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return new EmployeeDashboardDto(
            myRank,
            totalUsers,
            myPersons.Count,
            mySales.Count(s => s.Status != "Cancelled"),
            myCommissions.Sum(c => c.Amount),
            myCommissions.Where(c => c.Status == "Pending").Sum(c => c.Amount),
            myCommissions.Where(c => c.Status is "Approved" or "Paid").Sum(c => c.Amount),
            BuildMonthly(mySales, from, to),
            BuildPaymentStatus(windowSales.Count > 0 ? windowSales : mySales),
            myPersons.Take(5).Select(Map.ToDto).ToList(),
            mySales.OrderByDescending(s => s.SaleDate).Take(5).Select(Map.ToDto).ToList());
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(DateTime from, DateTime to)
    {
        var sales = await db.Sales
            .Include(s => s.Person).Include(s => s.Plot)
            .Include(s => s.Payments).Include(s => s.RegisteredBy)
            .ToListAsync();

        var windowSales = sales.Where(s => s.SaleDate >= from && s.SaleDate <= to && s.Status != "Cancelled").ToList();

        var persons = await db.Persons.Include(p => p.Sales).ToListAsync();
        var commissions = await db.Commissions.Include(c => c.User).Include(c => c.Sale).ThenInclude(s => s!.Plot)
            .Include(c => c.Sale).ThenInclude(s => s!.Person)
            .ToListAsync();

        // Admin performance
        var perf = sales.Where(s => s.Status != "Cancelled")
            .GroupBy(s => new { s.RegisteredById, Name = s.RegisteredBy!.FullName })
            .Select(g =>
            {
                var rev = g.Sum(x => x.DealAmount);
                var comm = commissions.Where(c => c.UserId == g.Key.RegisteredById).Sum(c => c.Amount);
                return new { g.Key.RegisteredById, g.Key.Name, Plots = g.Count(), Revenue = rev, Commission = comm };
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        var topAdmins = perf.Select((x, i) =>
            new AdminPerformanceDto(i + 1, x.RegisteredById, x.Name, x.Plots, x.Revenue, x.Commission)).ToList();

        var received = sales.SelectMany(s => s.Payments).Where(p => p.Status == "Approved").Sum(p => p.Amount);
        var pending = sales.Sum(s => Math.Max(0, s.DealAmount - s.Payments.Where(p => p.Status == "Approved").Sum(p => p.Amount)));
        var advance = sales.SelectMany(s => s.Payments).Where(p => p.PaymentType == "Advance" && p.Status == "Pending").Sum(p => p.Amount);

        return new AdminDashboardDto(
            await db.Users.CountAsync(),
            await db.Users.CountAsync(u => u.Status == "Active"),
            persons.Count,
            sales.Count(s => s.Status != "Cancelled"),
            sales.Where(s => s.Status != "Cancelled").Sum(s => s.DealAmount),
            received, pending, advance,
            received + pending <= 0 ? 0 : Math.Round(received / (received + pending) * 100, 0),
            BuildMonthly(sales, from, to),
            BuildPaymentStatus(sales),
            topAdmins,
            sales.OrderByDescending(s => s.SaleDate).Take(5).Select(Map.ToDto).ToList(),
            commissions.Where(c => c.Status == "Pending")
                .OrderByDescending(c => c.RequestedAt)
                .Take(5).Select(Map.ToDto).ToList());
    }

    public async Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to, int? restrictUserId = null)
    {
        var q = db.Sales
            .Include(s => s.Person).Include(s => s.Plot).Include(s => s.Payments).Include(s => s.RegisteredBy)
            .Where(s => s.SaleDate >= from && s.SaleDate <= to && s.Status != "Cancelled");
        if (restrictUserId is > 0) q = q.Where(s => s.RegisteredById == restrictUserId);

        var sales = await q.ToListAsync();
        var received = sales.SelectMany(s => s.Payments).Where(p => p.Status == "Approved").Sum(p => p.Amount);
        var pending = sales.Sum(s => Math.Max(0, s.DealAmount - s.Payments.Where(p => p.Status == "Approved").Sum(p => p.Amount)));

        var commissions = await db.Commissions.ToListAsync();

        var byMember = sales
            .GroupBy(s => new { s.RegisteredById, Name = s.RegisteredBy!.FullName })
            .Select(g =>
            {
                var rev = g.Sum(x => x.DealAmount);
                var comm = commissions.Where(c => c.UserId == g.Key.RegisteredById).Sum(c => c.Amount);
                return new { g.Key.RegisteredById, g.Key.Name, Plots = g.Count(), Revenue = rev, Commission = comm };
            })
            .OrderByDescending(x => x.Revenue)
            .Select((x, i) => new AdminPerformanceDto(i + 1, x.RegisteredById, x.Name, x.Plots, x.Revenue, x.Commission))
            .ToList();

        return new SalesReportDto(
            from, to, sales.Count, sales.Sum(s => s.DealAmount), received, pending,
            sales.Count, BuildMonthly(sales, from, to), byMember);
    }
}
