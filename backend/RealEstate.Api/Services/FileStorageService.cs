namespace RealEstate.Api.Services;

public class FileStorageService(IWebHostEnvironment env, IConfiguration config)
{
    public async Task<string> SaveSiteVisitPhotoAsync(IFormFile file)
    {
        var allowed = config.GetSection("Uploads:AllowedExtensions").Get<string[]>()
                     ?? [".jpg", ".jpeg", ".png", ".webp"];
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            throw new InvalidOperationException($"File type '{ext}' not allowed. Allowed: {string.Join(", ", allowed)}");

        var maxMb = double.TryParse(config["Uploads:MaxFileSizeMB"], out var mb) ? mb : 10;
        if (file.Length > maxMb * 1024 * 1024)
            throw new InvalidOperationException($"File too large. Max {maxMb} MB.");

        var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var dir = Path.Combine(webRoot, "uploads", "sitevisits");
        Directory.CreateDirectory(dir);

        var name = $"{Guid.NewGuid():N}{ext}";
        await using var stream = new FileStream(Path.Combine(dir, name), FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/sitevisits/{name}";
    }

    public void DeleteSiteVisitPhoto(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath)) return;
        var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var relative = filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var full = Path.Combine(webRoot, relative);
        if (File.Exists(full)) File.Delete(full);
    }
}
