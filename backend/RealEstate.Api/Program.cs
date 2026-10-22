using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RealEstate.Api.Data;
using RealEstate.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---------- Controllers / JSON ----------
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// ---------- Swagger ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "RealEstate Panel API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ---------- Database (SQL Server default, SQLite fallback for local demo) ----------
var provider = builder.Configuration["Database:Provider"] ?? "SqlServer";
var useSqlite = provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase);

if (!useSqlite)
{
    var sqlCs = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? "Server=localhost;Database=RealEstateDb;Trusted_Connection=True;TrustServerCertificate=True;";

    // Probe SQL Server quickly so the app doesn't crash deep in EF later
    var reachable = false;
    try
    {
        var probeCs = sqlCs.Contains("Connection Timeout", StringComparison.OrdinalIgnoreCase)
            ? sqlCs
            : sqlCs + (sqlCs.EndsWith(';') ? "" : ";") + "Connection Timeout=3";
        using var probe = new Microsoft.Data.SqlClient.SqlConnection(probeCs);
        probe.Open();
        reachable = true;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] SQL Server unreachable: {ex.Message.Split('\n')[0]}");
    }

    if (reachable)
    {
        builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(sqlCs));
        Console.WriteLine("[DB] Using SQL Server.");
    }
    else if (builder.Environment.IsDevelopment())
    {
        useSqlite = true;
        Console.WriteLine("[DB] >> SQL Server nahi mila. DEMO MODE (SQLite) se start ho raha hai.");
        Console.WriteLine("[DB] >> SQL Server use karna hai to appsettings.json me ConnectionStrings:DefaultConnection set karein.");
    }
    else
    {
        throw new InvalidOperationException(
            "SQL Server unreachable. ConnectionStrings:DefaultConnection check karein, " +
            "ya demo ke liye ASPNETCORE_ENVIRONMENT=Development set karein (SQLite fallback).");
    }
}

if (useSqlite)
{
    var sqliteCs = builder.Configuration.GetConnectionString("Sqlite") ?? "Data Source=RealEstate.db";
    builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(sqliteCs));
}

// ---------- JWT Auth ----------
var jwtSection = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });
builder.Services.AddAuthorization();

// ---------- CORS (Angular dev server / live preview) ----------
builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p
    .SetIsOriginAllowed(_ => true)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// ---------- App services ----------
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddSingleton<FileStorageService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Frontend");
app.UseDefaultFiles();
app.UseStaticFiles();               // serves wwwroot/uploads (site-visit photos)
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

// ---------- Auto create schema + seed demo data ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbSeeder.MigrateAndSeed(db);
}

app.Run();
