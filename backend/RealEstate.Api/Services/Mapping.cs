using RealEstate.Api.Dtos;
using RealEstate.Api.Models;

namespace RealEstate.Api.Services;

public static class Map
{
    public static UserDto ToDto(User u, int totalRegistered = 0, int plotsSold = 0, decimal revenue = 0) => new(
        u.Id, u.FullName, u.Email, u.Phone, u.Role, u.Status,
        u.ParentUserId, u.ParentUser?.FullName, u.ProfilePhoto, u.Designation,
        u.CommissionRate, u.CreatedAt, totalRegistered, plotsSold, revenue);

    public static PersonDto ToDto(Person p) => new(
        p.Id, p.FullName, p.Phone, p.Email, p.Address, p.IdProofNumber,
        p.Status, p.Notes, p.RegisteredById, p.RegisteredBy?.FullName ?? "",
        p.CreatedAt, p.Sales?.Count(s => s.Status != "Cancelled") ?? 0,
        p.Sales?.Where(s => s.Status != "Cancelled").Sum(s => s.DealAmount) ?? 0);

    public static PlotDto ToDto(Plot p) => new(
        p.Id, p.PlotNo, p.Project, p.Block, p.SizeSqFt, p.Price, p.Status, p.CreatedAt);

    public static SaleDto ToDto(Sale s)
    {
        var approved = s.Payments?.Where(p => p.Status == "Approved").Sum(p => p.Amount) ?? 0;
        var advancePending = s.Payments?.Where(p => p.PaymentType == "Advance" && p.Status == "Pending").Sum(p => p.Amount) ?? 0;
        var pending = Math.Max(0, s.DealAmount - approved);
        return new SaleDto(
            s.Id, s.PersonId, s.Person?.FullName ?? "", s.PlotId, s.Plot?.PlotNo ?? "",
            s.DealAmount, approved, pending, advancePending,
            s.SaleDate, s.Status, s.RegisteredById, s.RegisteredBy?.FullName ?? "", s.CreatedAt);
    }

    public static PaymentDto ToDto(Payment p) => new(
        p.Id, p.SaleId, p.Sale?.Person?.FullName ?? "", p.Sale?.Plot?.PlotNo ?? "",
        p.Amount, p.PaymentType, p.Method, p.Status, p.PaidAt, p.Notes,
        p.VerifiedById, null, p.VerifiedAt);

    public static CommissionDto ToDto(Commission c) => new(
        c.Id, c.UserId, c.User?.FullName ?? "", c.SaleId,
        c.Sale?.Plot?.PlotNo, c.Sale?.Person?.FullName,
        c.Amount, c.Rate, c.Status, c.RequestedAt, c.ApprovedAt);

    public static SiteVisitPhotoDto ToDto(SiteVisitPhoto p) => new(
        p.Id, p.FilePath, p.Caption, p.UploadedById, "", p.UploadedAt);

    public static SiteVisitDto ToDto(SiteVisit v) => new(
        v.Id, v.PersonId, v.Person?.FullName ?? "", v.Person?.Phone,
        v.PlotId, v.Plot?.PlotNo,
        v.VisitDate, v.Notes, v.Status, v.CreatedById, v.CreatedBy?.FullName ?? "",
        v.CreatedAt, v.Photos?.Select(ToDto).ToList() ?? new List<SiteVisitPhotoDto>());
}
