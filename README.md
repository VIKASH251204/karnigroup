# RealEstate — Admin & Associate Panel (Angular + .NET + SQL Server)

Real estate company ke liye complete web app — **Admin panel** (full access, image ka Super Admin panel) aur **Associate panel** (limited access, image ka Admin panel) ke saath.

## Features & Permissions

| Capability | Admin (Full Access) | Associate (Limited) |
|---|---|---|
| Dashboard | Company-wide (Super Admin style) | Own data only (limited panel style) |
| Register team members (3rd persons) | ✅ | ✅ (apne ID me) |
| Sell plots to clients | ✅ | ✅ (apne deals) |
| Site visit photos upload (proof) | ✅ | ✅ |
| Sales / Payments / Plots edit-delete | ✅ | ❌ sirf view |
| Manage admins / associates (add, edit, block) | ✅ | ❌ |
| Verify payments & commission approvals | ✅ | ❌ |
| Reports | Company-wide | Sirf apna data |
| My Rank / My Team / My Commission | ✅ | ✅ (view only) |

> Backend me role-based `[Authorize(Roles=...)]` enforcement hai — UI se hi nahi, API level pe bhi associate edit nahi kar sakta (403).

## Team vs Client (business model)

- **Team (My Team)** = jinhe associate **register** karta hai — wo uski team ke members hain
- **Client (My Clients)** = jinhe associate **plot sell** karta hai — wo uske clients (buyers) hain

## Tech Stack

- **Frontend:** Angular 18 (standalone components, signals, lazy routes)
- **Backend:** ASP.NET Core 8 Web API (JWT auth, Swagger, EF Core 8)
- **Database:** SQL Server (default) — local demo ke liye SQLite fallback bhi included
- **Charts:** Pure SVG components (no external chart library)
- **Photos:** File upload (`wwwroot/uploads/sitevisits`) + static file serving

## Project Structure

```
real-estate-panel/
├── backend/
│   └── RealEstate.Api/          # .NET 8 Web API
│       ├── Controllers/         # Auth, Dashboard, Persons, Plots, Sales, Payments,
│       │                        # Commissions, SiteVisits, Users, Reports
│       ├── Data/                # AppDbContext + DbSeeder (demo data)
│       ├── Models/              # User, Person, Plot, Sale, Payment, Commission, SiteVisit...
│       ├── Dtos/                # API request/response DTOs
│       └── Services/            # TokenService (JWT), DashboardService, FileStorageService
├── frontend/
│   └── src/app/
│       ├── core/                # auth service/guard/interceptor, api service, models
│       ├── layout/              # sidebar + topbar shell (role-based menu)
│       ├── shared/              # icons, charts (bar/combo/donut), pipes, toasts
│       └── pages/               # login, dashboards, persons, sales, payments,
│                                # commissions, plots, users, site-visits, reports...
└── database/
    └── schema.sql               # SQL Server DDL (manual provisioning ke liye)
```

## Setup — Backend (.NET API)

```bash
cd backend/RealEstate.Api

# Option A: SQL Server (production style)
#   - appsettings.json -> "Database": { "Provider": "SqlServer" }
#   - ConnectionStrings:DefaultConnection apne server ke hisaab se set karein
dotnet run --urls http://localhost:5080

# Option B: SQLite (local demo, koi SQL Server install nahi chahiye)
#   - appsettings.Development.json already SQLite use karta hai
ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://localhost:5080
```

- Swagger UI: `http://localhost:5080/swagger`
- Pehli run par schema auto-create + demo data auto-seed hota hai (15 users, 84 plots, 160 persons, 84 sales, payments, commissions, 28 site visits with photos).

## Setup — Frontend (Angular)

```bash
cd frontend
npm install
npm start          # ng serve -> http://localhost:4200 (API proxy -> :5080)
```

Production build: `ng build` → `dist/realestate-panel/` (API ke `wwwroot` me copy karke single-origin deploy bhi kar sakte hain).

## Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** (full access) | `admin@realestate.com` | `Admin@123` |
| **Associate** (limited) | `associate@realestate.com` | `Assoc@123` |

Aur bhi demo accounts: `amit@ / neha@ / suresh@ / vikram@realestate.com` (Admin@123), `pooja@ / rahul@ / arjun@ ...` (Assoc@123) — Users page me dikhte hain.

## API Endpoints (summary)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | JWT login |
| GET | `/api/auth/me` | Any | Current user |
| POST | `/api/auth/change-password` | Any | Change own password |
| GET | `/api/dashboard/associate` | Any | Associate dashboard stats |
| GET | `/api/dashboard/admin` | Admin | Company-wide dashboard |
| GET/POST | `/api/persons` | Any | List / **register 3rd person** |
| PUT/DELETE | `/api/persons/{id}` | Admin | Edit / delete person |
| GET | `/api/plots` | Any | Plot inventory |
| POST/PUT/DELETE | `/api/plots/{id}` | Admin | Manage plots & pricing |
| GET | `/api/sales` | Any (own/admin) | List sales |
| POST/PUT/DELETE | `/api/sales/{id}` | Admin | Manage sales |
| GET/POST | `/api/payments` | Any / Admin | List / add payments |
| PUT | `/api/payments/{id}/verify` | Admin | Approve / reject payment |
| GET | `/api/commissions` | Any (own/admin) | Commission list |
| PUT | `/api/commissions/{id}/approve|pay|reject` | Admin | Commission actions |
| GET/POST | `/api/sitevisits` | Any | List / create site visit |
| POST | `/api/sitevisits/{id}/photos` | Any | **Upload visit photos (multipart)** |
| PUT/DELETE | `/api/sitevisits/{id}` | Admin | Edit / delete visit |
| GET/POST/PUT/DELETE | `/api/users` | Admin (GET: team for associate) | Manage staff |
| GET | `/api/reports/sales` `/api/reports/commissions` | Any | Reports |

## Database

- **SQL Server:** `database/schema.sql` manually chalayein, ya EF Core ko `EnsureCreated()` se auto-create hone dein (default behaviour).
- **Provider switch:** `appsettings.json` → `"Database": { "Provider": "SqlServer" }` ya `"Sqlite"`.
- **Seed data:** `Data/DbSeeder.cs` — first run par populate hota hai; DB me users already hain to skip ho jata hai.

## Roles Flow (as per requirement)

1. **Admin** = image ka **Super Admin panel** — full edit control: manage admins, verify payments, manage plots, full reports, all site photos.
2. **Associate** = image ka **Admin panel** — sirf:
   - 3rd person register kar sakta hai (apne ID me)
   - Site visit par photos bhej sakta hai
   - Baaki sab **view only** (sales, payments, plots, commissions edit nahi kar sakta)
