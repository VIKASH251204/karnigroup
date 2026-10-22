namespace RealEstate.Api.Dtos;

// ============ AUTH / USERS ============
public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, UserDto User);
public record ChangePasswordRequest(string OldPassword, string NewPassword);

public record UserDto(
    int Id, string FullName, string Email, string Phone, string Role, string Status,
    int? ParentUserId, string? ParentName, string? ProfilePhoto, string? Designation,
    decimal CommissionRate, DateTime CreatedAt,
    int TotalRegistered, int PlotsSold, decimal Revenue);

public record CreateUserRequest(
    string FullName, string Email, string Phone, string Password,
    string Role, int? ParentUserId, decimal CommissionRate, string? Designation);

public record UpdateUserRequest(
    string FullName, string Email, string Phone, string Role, string Status,
    int? ParentUserId, decimal CommissionRate, string? Designation, string? Password);

// ============ PERSONS (3rd party registration) ============
public record PersonDto(
    int Id, string FullName, string Phone, string? Email, string? Address, string? IdProofNumber,
    string Status, string? Notes, int RegisteredById, string RegisteredByName,
    DateTime CreatedAt, int SaleCount, decimal TotalBusiness);

public record PersonRequest(
    string FullName, string Phone, string? Email, string? Address,
    string? IdProofNumber, string? Notes, string Status);

// ============ PLOTS ============
public record PlotDto(
    int Id, string PlotNo, string Project, string? Block, decimal SizeSqFt,
    decimal Price, string Status, DateTime CreatedAt);

public record PlotRequest(
    string PlotNo, string Project, string? Block, decimal SizeSqFt, decimal Price, string Status);

// ============ SALES / PAYMENTS ============
public record SaleDto(
    int Id, int PersonId, string ClientName, int PlotId, string PlotNo,
    decimal DealAmount, decimal ReceivedAmount, decimal PendingAmount, decimal AdvanceAmount,
    DateTime SaleDate, string Status, int RegisteredById, string RegisteredByName,
    DateTime CreatedAt);

public record SaleRequest(
    int PersonId, int PlotId, decimal DealAmount, DateTime SaleDate, string Status);

public record PaymentDto(
    int Id, int SaleId, string ClientName, string PlotNo, decimal Amount,
    string PaymentType, string Method, string Status, DateTime PaidAt, string? Notes,
    int? VerifiedById, string? VerifiedByName, DateTime? VerifiedAt);

public record PaymentRequest(
    int SaleId, decimal Amount, string PaymentType, string Method, DateTime PaidAt, string? Notes);

public record VerifyRequest(string Status, string? Notes);

// ============ COMMISSIONS ============
public record CommissionDto(
    int Id, int UserId, string UserName, int? SaleId, string? PlotNo, string? ClientName,
    decimal Amount, decimal Rate, string Status, DateTime RequestedAt, DateTime? ApprovedAt);

public record CommissionRequest(int UserId, int? SaleId, decimal Amount, decimal Rate);

// ============ SITE VISITS ============
public record SiteVisitDto(
    int Id, int PersonId, string ClientName, string? ClientPhone, int? PlotId, string? PlotNo,
    DateTime VisitDate, string? Notes, string Status, int CreatedById, string CreatedByName,
    DateTime CreatedAt, List<SiteVisitPhotoDto> Photos);

public record SiteVisitPhotoDto(
    int Id, string FilePath, string? Caption, int UploadedById, string UploadedByName, DateTime UploadedAt);

public record SiteVisitRequest(
    int PersonId, int? PlotId, DateTime VisitDate, string? Notes, string Status);

// ============ DASHBOARD / REPORTS ============
public record MonthlyPoint(string Month, int PlotsSold, decimal Revenue);

public record PaymentStatusDto(
    decimal Received, decimal Pending, decimal Advance, decimal ReceivedPercent);

public record EmployeeDashboardDto(
    int MyRank, int TotalUsers, int TotalRegistered, int TotalPlotsSold,
    decimal TotalCommission, decimal PendingCommission, decimal ApprovedCommission,
    List<MonthlyPoint> SalesOverview,
    PaymentStatusDto PaymentStatus,
    List<PersonDto> RecentPersons,
    List<SaleDto> RecentSales);

public record AdminPerformanceDto(
    int Rank, int UserId, string AdminName, int PlotsSold, decimal Revenue, decimal Commission);

public record AdminDashboardDto(
    int TotalAdmins, int ActiveAdmins, int TotalRegistered, int TotalPlotsSold,
    decimal TotalRevenue, decimal TotalReceived, decimal TotalPending, decimal TotalAdvance,
    decimal ReceivedPercent,
    List<MonthlyPoint> SalesRevenueOverview,
    PaymentStatusDto PaymentCollection,
    List<AdminPerformanceDto> TopAdmins,
    List<SaleDto> RecentSales,
    List<CommissionDto> PendingCommissions);

public record ReportFilter(DateTime From, DateTime To);

public record SalesReportDto(
    DateTime From, DateTime To, int TotalDeals, decimal TotalRevenue,
    decimal TotalReceived, decimal TotalPending, int PlotsSold,
    List<MonthlyPoint> Monthly, List<AdminPerformanceDto> ByMember);

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);
