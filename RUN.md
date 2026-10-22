# 🚀 Run Guide — RealEstate Admin + Associate Panel

Do cheezein chalani hain: **Backend (.NET API)** aur **Frontend (Angular)**.
Pehle backend START karein, phir frontend. (Windows ke liye neeche shortcut scripts hain.)

---

## 📦 Prerequisites (ek baar install karna hai)

| Software | Download | Check karein |
|---|---|---|
| .NET 8 SDK | https://dotnet.microsoft.com/download/dotnet/8.0 | `dotnet --version` → 8.x |
| Node.js 18+ (20 best) | https://nodejs.org | `node --version` → v18/v20 |
| SQL Server (optional) | SQL Server 2016+ / Express (free) | — |

---

## ⚡ Quick Start (Demo Mode — SQL Server ki zaroorat NAHI)

### 1. Backend chalayein
```bat
cd backend\RealEstate.Api
dotnet run
```
> ✅ Ab `dotnet run` **khud smart hai**: SQL Server mile toh use karega, na mile toh
> **demo mode (SQLite)** se start ho jayega — crash nahi hoga. Console me dikhega:
> `[DB] >> SQL Server nahi mila. DEMO MODE (SQLite) se start ho raha hai.`

Check: browser me **http://localhost:5080/api/health** → `{"status":"ok"}` aana chahiye.

### 2. Frontend chalayein (naya terminal kholein)
```bat
cd frontend
npm install        (sirf pehli baar)
npm start
```

### 3. Browser mein kholein 👉 **http://localhost:4200**

---

## 🗄️ SQL Server ke saath chalana hai toh

1. SSMS me `database/schema.sql` run karein (optional — API khud bhi schema bana deta hai)
2. `backend/RealEstate.Api/appsettings.json` me apna connection string set karein:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=YOUR_SERVER;Database=RealEstateDb;User Id=sa;Password=YOUR_PWD;TrustServerCertificate=True;"
   }
   ```
3. Backend chalayein: `dotnet run` (SQL Server reachable hoga toh automatically use hoga)

---

## 🔑 Login IDs (demo data ke saath)

| Role | Email | Password |
|---|---|---|
| **Admin** (full access) | `admin@realestate.com` | `Admin@123` |
| **Associate** (limited) | `associate@realestate.com` | `Assoc@123` |

---

## ⚠️ "Login failed" aa raha hai? — 30 second checklist

Login fail ka **99% reason: backend (API) chal nahi raha**.

1. **Backend check:** browser me kholein 👉 http://localhost:5080/api/health
   - `{"status":"ok"}` nahi aa raha → backend terminal me chalayein (upar step 1)
   - Backend terminal me error → screenshot lein / error message padhein
2. **Frontend ka terminal** alag hona chahiye (backend wala terminal band mat karein!)
3. **Dono sahi hain phir bhi fail?** Frontend `proxy.conf.json` me target port check karein
   (default `http://localhost:5080`). Agar backend alag port pe hai to dono jagah same karein.
4. Ab login page pe error aayega toh **exact wajah** likhi aayegi
   (API connect nahi hua vs galat password) — wo message follow karein.

---

## 🧪 Verify karein ki sab theek hai

| Check | URL | Expected |
|---|---|---|
| API health | http://localhost:5080/api/health | `{"status":"ok",...}` |
| Swagger (API docs) | http://localhost:5080/swagger | API list |
| App login | http://localhost:4200 | Login page → dashboard |

---

## ❌ Other Common Problems

| Problem | Solution |
|---|---|
| `dotnet: command not found` | .NET 8 SDK install karein, terminal RESTART karein |
| `npm install` slow/fail | `npm install` dobara; proxy/network check karein |
| Port 5080/4200 busy | Backend: `dotnet run --urls http://localhost:5090` + `frontend/proxy.conf.json` target bhi 5090 |
| Sab fresh chahiye | `backend/RealEstate.Api/RealEstate.db` delete karein (demo) ya DB drop karein — seed dobara chalega |
| SQL Server mode theek se nahi chala | Console me `[DB]` messages dekhein — SQL unreachable ho toh SQLite fallback bata deta hai |

---

## 📁 Shortcut scripts

- **Windows:** `start-backend.bat` double-click = backend | `start-frontend.bat` double-click = frontend
- **Linux/Mac:** `./start.sh` (dono ek saath) | `./start.sh sqlserver` (SQL Server mode)
