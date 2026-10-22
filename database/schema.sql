/* ============================================================
   RealEstate Panel — SQL Server Schema + Sample Seed
   Run this on SQL Server 2016+ (or Azure SQL).

   NOTE: The API auto-creates this schema via EF Core EnsureCreated().
   Use this script when you want to provision the database manually
   (e.g. production / DBA-managed SQL Server).
   ============================================================ */

IF DB_ID('RealEstateDb') IS NULL
    CREATE DATABASE RealEstateDb;
GO
USE RealEstateDb;
GO

/* ---------------- Users (Admins & Employees) ---------------- */
CREATE TABLE Users (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    FullName        NVARCHAR(120)  NOT NULL,
    Email           NVARCHAR(150)  NOT NULL,
    Phone           NVARCHAR(20)   NOT NULL,
    PasswordHash    NVARCHAR(250)  NOT NULL,
    Role            NVARCHAR(20)   NOT NULL DEFAULT('Employee'),   -- Admin | Employee
    Status          NVARCHAR(20)   NOT NULL DEFAULT('Active'),      -- Active | Blocked
    ParentUserId    INT            NULL,
    ProfilePhoto    NVARCHAR(300)  NULL,
    Designation     NVARCHAR(50)   NULL,
    CommissionRate  DECIMAL(5,2)   NOT NULL DEFAULT(5),
    CreatedAt       DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    CONSTRAINT FK_Users_Parent FOREIGN KEY (ParentUserId) REFERENCES Users(Id)
);
CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
GO

/* ---------------- Persons (3rd party registration) ---------------- */
CREATE TABLE Persons (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    FullName        NVARCHAR(120)  NOT NULL,
    Phone           NVARCHAR(20)   NOT NULL,
    Email           NVARCHAR(150)  NULL,
    Address         NVARCHAR(300)  NULL,
    IdProofNumber   NVARCHAR(50)   NULL,
    Status          NVARCHAR(20)   NOT NULL DEFAULT('Active'),      -- Active | Inactive
    Notes           NVARCHAR(500)  NULL,
    RegisteredById  INT            NOT NULL,
    CreatedAt       DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    CONSTRAINT FK_Persons_User FOREIGN KEY (RegisteredById) REFERENCES Users(Id)
);
CREATE INDEX IX_Persons_Phone ON Persons(Phone);
CREATE INDEX IX_Persons_RegisteredById ON Persons(RegisteredById);
GO

/* ---------------- Plots (inventory) ---------------- */
CREATE TABLE Plots (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    PlotNo          NVARCHAR(30)   NOT NULL,
    Project         NVARCHAR(100)  NOT NULL,
    Block           NVARCHAR(50)   NULL,
    SizeSqFt        DECIMAL(12,2)  NOT NULL DEFAULT(0),
    Price           DECIMAL(18,2)  NOT NULL DEFAULT(0),
    Status          NVARCHAR(20)   NOT NULL DEFAULT('Available'),   -- Available | Sold | Blocked
    CreatedAt       DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME())
);
CREATE UNIQUE INDEX IX_Plots_PlotNo ON Plots(PlotNo);
GO

/* ---------------- Sales ---------------- */
CREATE TABLE Sales (
    Id               INT IDENTITY(1,1) PRIMARY KEY,
    PersonId         INT            NOT NULL,
    PlotId           INT            NOT NULL,
    DealAmount       DECIMAL(18,2)  NOT NULL DEFAULT(0),
    SaleDate         DATETIME2      NOT NULL,
    Status           NVARCHAR(20)   NOT NULL DEFAULT('InProgress'), -- InProgress | Completed | Cancelled
    RegisteredById   INT            NOT NULL,
    CreatedAt        DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    CONSTRAINT FK_Sales_Person FOREIGN KEY (PersonId) REFERENCES Persons(Id),
    CONSTRAINT FK_Sales_Plot   FOREIGN KEY (PlotId)   REFERENCES Plots(Id),
    CONSTRAINT FK_Sales_User   FOREIGN KEY (RegisteredById) REFERENCES Users(Id)
);
CREATE INDEX IX_Sales_PersonId ON Sales(PersonId);
CREATE INDEX IX_Sales_PlotId ON Sales(PlotId);
CREATE INDEX IX_Sales_RegisteredById ON Sales(RegisteredById);
GO

/* ---------------- Payments ---------------- */
CREATE TABLE Payments (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    SaleId        INT            NOT NULL,
    Amount        DECIMAL(18,2)  NOT NULL DEFAULT(0),
    PaymentType   NVARCHAR(20)   NOT NULL DEFAULT('Received'),   -- Received | Advance
    Method        NVARCHAR(20)   NOT NULL DEFAULT('BankTransfer'),-- Cash | UPI | BankTransfer | Cheque
    Status        NVARCHAR(20)   NOT NULL DEFAULT('Pending'),     -- Pending | Approved | Rejected
    PaidAt        DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    Notes         NVARCHAR(300)  NULL,
    VerifiedById  INT            NULL,
    VerifiedAt    DATETIME2      NULL,
    CONSTRAINT FK_Payments_Sale FOREIGN KEY (SaleId) REFERENCES Sales(Id) ON DELETE CASCADE
);
CREATE INDEX IX_Payments_SaleId ON Payments(SaleId);
GO

/* ---------------- Commissions ---------------- */
CREATE TABLE Commissions (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    UserId        INT            NOT NULL,
    SaleId        INT            NULL,
    Amount        DECIMAL(18,2)  NOT NULL DEFAULT(0),
    Rate          DECIMAL(5,2)   NOT NULL DEFAULT(5),
    Status        NVARCHAR(20)   NOT NULL DEFAULT('Pending'),   -- Pending | Approved | Paid | Rejected
    RequestedAt   DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    ApprovedAt    DATETIME2      NULL,
    ApprovedById  INT            NULL,
    CONSTRAINT FK_Commissions_User FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_Commissions_Sale FOREIGN KEY (SaleId) REFERENCES Sales(Id) ON DELETE SET NULL
);
GO

/* ---------------- Site Visits + Photos ---------------- */
CREATE TABLE SiteVisits (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    PersonId      INT            NOT NULL,
    PlotId        INT            NULL,
    VisitDate     DATETIME2      NOT NULL,
    Notes         NVARCHAR(500)  NULL,
    Status        NVARCHAR(20)   NOT NULL DEFAULT('Completed'),  -- Scheduled | Completed | Cancelled
    CreatedById   INT            NOT NULL,
    CreatedAt     DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    CONSTRAINT FK_SiteVisits_Person FOREIGN KEY (PersonId) REFERENCES Persons(Id),
    CONSTRAINT FK_SiteVisits_Plot   FOREIGN KEY (PlotId)   REFERENCES Plots(Id) ON DELETE SET NULL,
    CONSTRAINT FK_SiteVisits_User   FOREIGN KEY (CreatedById) REFERENCES Users(Id)
);
GO

CREATE TABLE SiteVisitPhotos (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    SiteVisitId   INT            NOT NULL,
    FilePath      NVARCHAR(300)  NOT NULL,
    Caption       NVARCHAR(200)  NULL,
    UploadedById  INT            NOT NULL,
    UploadedAt    DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
    CONSTRAINT FK_SiteVisitPhotos_Visit FOREIGN KEY (SiteVisitId) REFERENCES SiteVisits(Id) ON DELETE CASCADE
);
GO

/* ============================================================
   SAMPLE SEED (minimal — the API seeder adds a fuller demo set)
   Password for both users below: Admin@123 / Emp@123
   Hash format: PBKDF2(salt.hash) — generated by RealEstate.Api.Services.PasswordHasher
   ============================================================ */
INSERT INTO Users (FullName, Email, Phone, PasswordHash, Role, Status, CommissionRate, Designation)
VALUES
 ('Rohit Sharma', 'admin@realestate.com',    '9876500011', '', 'Admin',    'Active', 8, 'Sales Head'),
 ('Aman Verma',   'employee@realestate.com', '9876543210', '', 'Employee', 'Active', 5, 'Sales Executive');
GO

/* NOTE: PasswordHash is left blank here on purpose.
   Simplest production setup: run the API once against this DB and use the
   built-in DbSeeder (set "Database:Provider": "SqlServer"), OR register users
   via the Admin panel UI (Add Member), which hashes passwords with PBKDF2. */

PRINT 'RealEstateDb schema created successfully.';
GO
