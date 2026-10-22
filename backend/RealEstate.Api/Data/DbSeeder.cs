using Microsoft.EntityFrameworkCore;
using RealEstate.Api.Models;
using RealEstate.Api.Services;

namespace RealEstate.Api.Data;

public static class DbSeeder
{
    public static void MigrateAndSeed(AppDbContext db)
    {
        db.Database.EnsureCreated();

        if (db.Users.Any())
            return; // already seeded

        var rand = new Random(42);
        var now = DateTime.UtcNow;

        // ---------------- Users ----------------
        var adminPw = PasswordHasher.Hash("Admin@123");
        var empPw = PasswordHasher.Hash("Assoc@123");

        var admins = new[]
        {
            new User { FullName = "Rohit Sharma", Email = "admin@realestate.com", Phone = "9876500011", Role = Roles.Admin, Designation = "Sales Head", CommissionRate = 8, PasswordHash = adminPw, CreatedAt = now.AddMonths(-20) },
            new User { FullName = "Amit Gupta", Email = "amit@realestate.com", Phone = "9876500022", Role = Roles.Admin, Designation = "Sr. Manager", CommissionRate = 7, PasswordHash = adminPw, CreatedAt = now.AddMonths(-18) },
            new User { FullName = "Neha Yadav", Email = "neha@realestate.com", Phone = "9876500033", Role = Roles.Admin, Designation = "Sr. Manager", CommissionRate = 7, PasswordHash = adminPw, CreatedAt = now.AddMonths(-16) },
            new User { FullName = "Suresh Patel", Email = "suresh@realestate.com", Phone = "9876500044", Role = Roles.Admin, Designation = "Manager", CommissionRate = 6, PasswordHash = adminPw, CreatedAt = now.AddMonths(-14) },
            new User { FullName = "Vikram Singh", Email = "vikram@realestate.com", Phone = "9876500055", Role = Roles.Admin, Designation = "Manager", CommissionRate = 6, PasswordHash = adminPw, CreatedAt = now.AddMonths(-12) },
        };
        db.Users.AddRange(admins);
        db.SaveChanges();

        var employees = new[]
        {
            new User { FullName = "Aman Verma",   Email = "associate@realestate.com", Phone = "9876543210", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[0].Id, CreatedAt = now.AddMonths(-11) },
            new User { FullName = "Pooja Mehta",  Email = "pooja@realestate.com",    Phone = "9876501234", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[0].Id, CreatedAt = now.AddMonths(-10) },
            new User { FullName = "Rahul Jain",   Email = "rahul@realestate.com",    Phone = "9988877766", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[0].Id, CreatedAt = now.AddMonths(-9) },
            new User { FullName = "Neha Singh",   Email = "neha.s@realestate.com",   Phone = "9988876655", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[1].Id, CreatedAt = now.AddMonths(-8) },
            new User { FullName = "Arjun Rathore",Email = "arjun@realestate.com",    Phone = "9876112233", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 4, PasswordHash = empPw, ParentUserId = admins[1].Id, CreatedAt = now.AddMonths(-7) },
            new User { FullName = "Kavita Sharma",Email = "kavita@realestate.com",   Phone = "9876223344", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[2].Id, CreatedAt = now.AddMonths(-6) },
            new User { FullName = "Mohit Agarwal",Email = "mohit@realestate.com",    Phone = "9876334455", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 4, PasswordHash = empPw, ParentUserId = admins[3].Id, CreatedAt = now.AddMonths(-5) },
            new User { FullName = "Divya Nair",   Email = "divya@realestate.com",    Phone = "9876445566", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[4].Id, CreatedAt = now.AddMonths(-4) },
            new User { FullName = "Sanjay Yadav", Email = "sanjay@realestate.com",   Phone = "9876556677", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 4, PasswordHash = empPw, ParentUserId = admins[4].Id, CreatedAt = now.AddMonths(-3) },
            new User { FullName = "Ishita Rao",   Email = "ishita@realestate.com",   Phone = "9876667788", Role = Roles.Associate, Designation = "Sales Executive", CommissionRate = 5, PasswordHash = empPw, ParentUserId = admins[2].Id, Status = "Blocked", CreatedAt = now.AddMonths(-2) },
        };
        db.Users.AddRange(employees);
        db.SaveChanges();

        var allUsers = db.Users.ToList();

        // ---------------- Plots ----------------
        var projects = new[]
        {
            ("Green Valley Enclave", "A"),
            ("Royal City Phase 2", "B"),
            ("Lake View Township", "C"),
            ("Shanti Kunj", "D"),
        };
        var plots = new List<Plot>();
        var plotNo = 1;
        foreach (var (project, block) in projects)
        {
            for (var i = 1; i <= 21; i++)
            {
                var size = rand.Next(900, 2600);
                // price in rupees, roughly 12L - 55L
                var price = RoundTo(Math.Max(1_200_000, size * (decimal)rand.NextDouble() * 12 + 1_200_000), 1000);
                plots.Add(new Plot
                {
                    PlotNo = $"{block}-{i:00}",
                    Project = project,
                    Block = block,
                    SizeSqFt = size,
                    Price = price,
                    Status = "Available",
                    CreatedAt = now.AddMonths(-12).AddDays(plotNo)
                });
                plotNo++;
            }
        }

        db.Plots.AddRange(plots);
        db.SaveChanges();

        // ---------------- Persons (3rd party registration) ----------------
        string[] firsts = ["Aman", "Pooja", "Rahul", "Neha", "Suresh", "Vijay", "Meena", "Ankit", "Sunita", "Ravi",
            "Kiran", "Deepak", "Anjali", "Manoj", "Priya", "Rajesh", "Swati", "Vikas", "Geeta", "Arun",
            "Sneha", "Nitin", "Preeti", "Sanjay", "Kavita", "Amit", "Rina", "Jitendra", "Shreya", "Mohan"];
        string[] lasts = ["Verma", "Mehta", "Jain", "Singh", "Kumar", "Pal", "Sharma", "Mishra", "Yadav", "Gupta",
            "Patel", "Rathore", "Agarwal", "Nair", "Rao", "Chauhan", "Saxena", "Tiwari", "Joshi", "Malhotra"];

        var persons = new List<Person>();
        for (var i = 0; i < 160; i++)
        {
            var registrar = allUsers[rand.Next(allUsers.Count)];
            var fn = firsts[rand.Next(firsts.Length)];
            var ln = lasts[rand.Next(lasts.Length)];
            persons.Add(new Person
            {
                FullName = $"{fn} {ln}",
                Phone = $"98{rand.Next(10000000, 99999999)}",
                Email = $"{fn.ToLower()}{i}@gmail.com",
                Address = $"{rand.Next(1, 220)}, {new[] { "Sector 12", "Model Town", "Civil Lines", "Vaishali Nagar", "Malviya Nagar" }[rand.Next(5)]}, Alwar, Rajasthan",
                IdProofNumber = $"XXXX-XXXX-{rand.Next(1000, 9999)}",
                Status = rand.NextDouble() > 0.08 ? "Active" : "Inactive",
                Notes = rand.NextDouble() > 0.7 ? "Interested in 2000+ sq.ft plot." : null,
                RegisteredById = registrar.Id,
                CreatedAt = now.AddDays(-rand.Next(5, 300))
            });
        }
        db.Persons.AddRange(persons);
        db.SaveChanges();

        // ---------------- Sales + Payments + Commissions ----------------
        var sales = new List<Sale>();
        var availablePlots = plots.Where(p => p.Status == "Available").ToList();

        for (var i = 0; i < 140; i++)
        {
            if (availablePlots.Count == 0) break;
            var plot = availablePlots[rand.Next(availablePlots.Count)];
            availablePlots.Remove(plot);
            var person = persons[rand.Next(persons.Count)];
            var seller = allUsers[rand.Next(allUsers.Count)];

            var dayOffset = rand.Next(0, 295);
            var saleDate = now.AddDays(-dayOffset);
            var deal = RoundTo(plot.Price * (decimal)(0.92 + rand.NextDouble() * 0.13), 1000);
            var completed = rand.NextDouble() > 0.55;
            var status = completed ? "Completed" : "InProgress";

            var sale = new Sale
            {
                PersonId = person.Id,
                PlotId = plot.Id,
                DealAmount = deal,
                SaleDate = saleDate,
                Status = status,
                RegisteredById = seller.Id,
                CreatedAt = saleDate
            };
            sales.Add(sale);
            plot.Status = "Sold";

            // Payments
            var advance = RoundTo(deal * (decimal)(0.05 + rand.NextDouble() * 0.08), 100);
            var advanceApproved = rand.NextDouble() > 0.35;
            sale.Payments.Add(new Payment
            {
                Amount = advance,
                PaymentType = "Advance",
                Method = new[] { "Cash", "UPI", "BankTransfer", "Cheque" }[rand.Next(4)],
                Status = advanceApproved ? "Approved" : "Pending",
                PaidAt = saleDate,
                Notes = "Booking token"
            });

            var targetReceived = completed ? deal : RoundTo(deal * (decimal)(0.35 + rand.NextDouble() * 0.3), 100);
            var remaining = targetReceived - (advanceApproved ? advance : 0);

            if (remaining > 0)
            {
                var first = RoundTo(remaining * (decimal)(0.45 + rand.NextDouble() * 0.4), 100);
                sale.Payments.Add(new Payment
                {
                    Amount = first,
                    PaymentType = "Received",
                    Method = new[] { "Cash", "UPI", "BankTransfer", "Cheque" }[rand.Next(4)],
                    Status = "Approved",
                    PaidAt = saleDate.AddDays(rand.Next(2, 25))
                });
                var second = remaining - first;
                if (second > 1000)
                {
                    sale.Payments.Add(new Payment
                    {
                        Amount = second,
                        PaymentType = "Received",
                        Method = "BankTransfer",
                        Status = "Approved",
                        PaidAt = saleDate.AddDays(rand.Next(26, 60))
                    });
                }
            }

            // a few payments still awaiting admin verification
            if (rand.NextDouble() > 0.78)
            {
                sale.Payments.Add(new Payment
                {
                    Amount = RoundTo(deal * (decimal)(0.05 + rand.NextDouble() * 0.1), 100),
                    PaymentType = "Received",
                    Method = "UPI",
                    Status = "Pending",
                    PaidAt = now.AddDays(-rand.Next(1, 12)),
                    Notes = "Awaiting verification"
                });
            }

            // Commission for the seller
            var rate = seller.CommissionRate;
            db.Commissions.Add(new Commission
            {
                UserId = seller.Id,
                Sale = sale,
                Amount = RoundTo(deal * rate / 100m, 100),
                Rate = rate,
                Status = rand.NextDouble() switch
                {
                    < 0.32 => "Pending",
                    < 0.7 => "Approved",
                    _ => "Paid"
                },
                RequestedAt = saleDate.AddDays(1),
                ApprovedAt = saleDate.AddDays(rand.Next(3, 20))
            });
        }
        db.Sales.AddRange(sales);
        db.SaveChanges();

        // ---------------- Site Visits + SVG photos ----------------
        var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var photoDir = Path.Combine(webRoot, "uploads", "sitevisits");
        Directory.CreateDirectory(photoDir);

        for (var i = 0; i < 28; i++)
        {
            var person = persons[rand.Next(persons.Count)];
            var creator = allUsers[rand.Next(allUsers.Count)];
            var visitDate = now.AddDays(-rand.Next(1, 120));
            var visit = new SiteVisit
            {
                PersonId = person.Id,
                PlotId = rand.NextDouble() > 0.35 ? plots[rand.Next(plots.Count)].Id : null,
                VisitDate = visitDate,
                Notes = new[] { "Client liked corner plot.", "Family visit - decision pending.", "Shown 2 options.", "Ready to close deal.", "Asked for price negotiation." }[rand.Next(5)],
                Status = visitDate.Date > now.Date ? "Scheduled" : "Completed",
                CreatedById = creator.Id,
                CreatedAt = visitDate
            };

            var photoCount = rand.Next(1, 5);
            for (var p = 1; p <= photoCount; p++)
            {
                var file = $"seed-visit-{i + 1}-{p}.svg";
                File.WriteAllText(Path.Combine(photoDir, file), SvgPhoto($"Site Visit #{i + 1}", $"Photo {p}", rand.Next(4)));
                visit.Photos.Add(new SiteVisitPhoto
                {
                    FilePath = $"/uploads/sitevisits/{file}",
                    Caption = new[] { "Main gate view", "Plot boundary", "Client at site", "Road facing", "Corner plot" }[rand.Next(5)],
                    UploadedById = creator.Id,
                    UploadedAt = visitDate.AddHours(p)
                });
            }
            db.SiteVisits.Add(visit);
        }
        db.SaveChanges();

        Console.WriteLine("[DbSeeder] Seed complete: " +
            $"{db.Users.Count()} users, {db.Plots.Count()} plots, {db.Persons.Count()} persons, " +
            $"{db.Sales.Count()} sales, {db.Payments.Count()} payments, {db.Commissions.Count()} commissions, " +
            $"{db.SiteVisits.Count()} site visits.");
    }

    /// <summary>Round to nearest multiple of 'unit' (C# Math.Round does not accept negative digits).</summary>
    private static decimal RoundTo(decimal value, int unit) =>
        Math.Round(value / unit, 0, MidpointRounding.AwayFromZero) * unit;

    private static string SvgPhoto(string title, string sub, int variant)
    {
        var palettes = new (string a, string b)[]
        {
            ("#4f86c6", "#a8d0f0"), ("#6aa84f", "#b6d7a8"), ("#e69138", "#f9cb9c"), ("#7e6bc4", "#c9c0ef")
        };
        var (c1, c2) = palettes[variant % palettes.Length];
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="{c1}"/><stop offset="100%" stop-color="{c2}"/>
                </linearGradient>
              </defs>
              <rect width="640" height="420" fill="url(#sky)"/>
              <rect y="270" width="640" height="150" fill="#7cb342" opacity="0.85"/>
              <polygon points="0,270 320,180 640,270" fill="#8bc34a" opacity="0.7"/>
              <rect x="60" y="200" width="120" height="90" fill="#efe0c9"/>
              <polygon points="50,200 120,150 190,200" fill="#c0392b"/>
              <rect x="100" y="235" width="30" height="55" fill="#6d4c41"/>
              <rect x="470" y="150" width="14" height="130" fill="#5d4037"/>
              <circle cx="477" cy="135" r="52" fill="#33691e" opacity="0.9"/>
              <rect x="240" y="300" width="180" height="12" fill="#fdd835" opacity="0.8"/>
              <rect x="240" y="340" width="180" height="12" fill="#fdd835" opacity="0.8"/>
              <rect x="20" y="20" width="330" height="72" rx="12" fill="#00000055"/>
              <text x="40" y="52" font-family="Arial, sans-serif" font-size="26" fill="#ffffff" font-weight="bold">{title}</text>
              <text x="40" y="80" font-family="Arial, sans-serif" font-size="20" fill="#ffffffdd">{sub}</text>
            </svg>
            """;
    }
}
