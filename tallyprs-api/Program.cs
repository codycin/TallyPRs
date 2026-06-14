using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.Data.Configurations;
using TallahasseePRs.Api.Hubs;
using TallahasseePRs.Api.Models;
using TallahasseePRs.Api.Models.Users;
using TallahasseePRs.Api.Security;
using TallahasseePRs.Api.Seeders;
using TallahasseePRs.Api.Services;
using TallahasseePRs.Api.Services.Conversations;
using TallahasseePRs.Api.Services.FeedServices;
using TallahasseePRs.Api.Services.FollowServices;
using TallahasseePRs.Api.Services.Media;
using TallahasseePRs.Api.Services.Notifications;
using TallahasseePRs.Api.Services.PostServices;
using TallahasseePRs.Api.Services.ProfileServices;
using TallahasseePRs.Api.Services.Storage;
using static TallahasseePRs.Api.Services.CurrentUserService;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "http://localhost:3001",
                "https://tally-p-i2mvaktmj-cody-cintron-s-projects.vercel.app",
                "https://tally-p-rs.vercel.app",
                // Local phone testing
                "http://192.168.1.43:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        
    });
});


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpContextAccessor();

// Auth/User Services
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.Configure<JwtOptions>(
builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFollowService, FollowService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<IProfileService>(sp => sp.GetRequiredService<ProfileService>());
builder.Services.AddScoped<IProfileQueryService>(sp => sp.GetRequiredService<ProfileService>());
builder.Services.AddScoped<IUserSearchService, UserSearchService>();

// Post services
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IVoteService, VoteService>();

// Feed service
builder.Services.AddScoped<IFeedService, FeedService>();

// Notifications
builder.Services.AddScoped<INotificationService, NotificationService>();

// Media service
builder.Services.Configure<MediaOptions>(
builder.Configuration.GetSection("Media"));
builder.Services.AddScoped<IMediaService, MediaService>();

//Video Processing
builder.Services.Configure<VideoProcessingOptions>(
builder.Configuration.GetSection("VideoProcessing"));
builder.Services.AddScoped<IVideoProcessingService, VideoProcessingService>();

// Storage services

builder.Services.Configure<R2Options>(builder.Configuration.GetSection("R2"));

builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var options = sp.GetRequiredService<IOptions<R2Options>>().Value;

    var config = new AmazonS3Config
    {
        ServiceURL = $"https://{options.AccountId}.r2.cloudflarestorage.com",
        ForcePathStyle = true
    };

    return new AmazonS3Client(
        options.AccessKeyId,
        options.SecretAccessKey,
        config);
});

builder.Services.AddScoped<IObjectStorage, CloudflareR2StorageService>(); 

// JWT config from appsettings json
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrEmpty(jwtKey))
    throw new Exception("Jwt:Key is missing from configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            RoleClaimType = ClaimTypes.Role,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs/messages"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

//Rate limiting 

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = 5;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("writes", limiter =>
    {
        limiter.PermitLimit = 20;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("reads", limiter =>
    {
        limiter.PermitLimit = 120;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });
});


//Logging

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

if (builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Information);
}
else
{
    builder.Logging.SetMinimumLevel(LogLevel.Warning);
}

//Signal R
builder.Services.AddSignalR();

builder.Services.AddScoped<IConversationService, ConversationService>();



var app = builder.Build();

app.Logger.LogInformation("Running in {Environment} environment", app.Environment.EnvironmentName);

app.UseCors("Frontend");
app.UseRateLimiter();


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    db.Database.Migrate();


    if (!db.Lifts.Any())
    {
        await LiftSeeder.SeedAsync(db);
    }

        await AdminSeeder.SeedAsync(db);
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MessageHub>("/hubs/messages");
app.Run();