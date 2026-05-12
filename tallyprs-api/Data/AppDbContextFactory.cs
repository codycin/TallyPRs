using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace TallahasseePRs.Api.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())     
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var cs = configuration.GetConnectionString("Default");

        if (string.IsNullOrWhiteSpace(cs))
            throw new InvalidOperationException(
                "Missing ConnectionStrings:Default in appsettings.json or appsettings.Development.json");

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(cs);

        return new AppDbContext(optionsBuilder.Options);
    }
}
