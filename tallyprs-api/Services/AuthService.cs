using Azure.Core;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.DTOs.Auth;
using TallahasseePRs.Api.Models.Users;
using TallahasseePRs.Api.Security;

namespace TallahasseePRs.Api.Services
{
    public class AuthService(AppDbContext context, IConfiguration configuration, IPasswordHasher<User> hasher) : IAuthService
    {
        public async Task<AuthResponse?> LoginAsync(LoginRequest dto)
        {

            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == dto.EmailOrUserName || u.UserName == dto.EmailOrUserName);
                    
            if (user is null) return null;

            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }
     
            var (token, expiresAt) = TokenService.CreateToken(user, configuration);
            var (_,rawRefresh) = await CreateRefreshTokenAsync(user);

            return new AuthResponse
            {
                User = new UserResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    UserName = user.UserName,
                    Role = user.Role
                },
                AccessToken = token,
                AccessTokenExpiration = expiresAt,
                RefreshToken = rawRefresh
            };
        }

        public async Task<AuthResponse?> RegisterAsync(RegisterRequest dto)
        {
            if (await context.Users.AnyAsync(u => u.Email == dto.Email)) return null;

            if (await context.Users.AnyAsync(u => u.UserName == dto.UserName)) return null;

            var user = new User { Email = dto.Email, Role = "Member" };
            user.UserName = dto.UserName;
            user.PasswordHash = hasher.HashPassword(user, dto.Password);
            user.Id = Guid.NewGuid();

            var profile = new Profile { UserId = user.Id };

            context.Users.Add(user);
            context.Profiles.Add(profile);
            await context.SaveChangesAsync();

            var (token, expiresAt) = TokenService.CreateToken(user, configuration);
            var (_, rawRefresh) = await CreateRefreshTokenAsync(user);

            return new AuthResponse
            {
                User = new UserResponse { Id = user.Id, Email = user.Email, UserName = user.UserName,
                    Role = user.Role
                },
                AccessToken = token,
                AccessTokenExpiration = expiresAt,
                RefreshToken = rawRefresh
            };
        }

        public async Task<AuthResponse?> RefreshAsync(RefreshRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken)) return null;

            var incomingHash = RefreshTokenUtil.HashToken(dto.RefreshToken);

            var existing = await context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.TokenHash == incomingHash);

            if (existing is null) return null;

            if(existing.RevokedAt != null)
            {
                var userTokens = await context.RefreshTokens
                .Where(r => r.UserId == existing.UserId && r.RevokedAt == null && r.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

                foreach (var t in userTokens)
                    t.RevokedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();
                return null;
            }

            if (DateTime.UtcNow >= existing.ExpiresAt) return null;

            var user = existing.User;

            existing.RevokedAt = DateTime.UtcNow;

            var (newEntity, newRaw) = await CreateRefreshTokenAsync(user);
            existing.ReplacedByTokenId = newEntity.Id;

            await context.SaveChangesAsync();

            // Issue new access token
            var (jwt, jwtExp) = TokenService.CreateToken(user, configuration);

            return new AuthResponse
            {
                User = new UserResponse { Id = user.Id, Email = user.Email, UserName = user.UserName,
                    Role = user.Role
                },
                AccessToken = jwt,
                AccessTokenExpiration = jwtExp,
                RefreshToken = newRaw
            };

        }

        public async Task<bool> LogoutAsync(RefreshRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken)) return false;

            var hash = RefreshTokenUtil.HashToken(dto.RefreshToken);

            var existing = await context.RefreshTokens
                .FirstOrDefaultAsync(r => r.TokenHash == hash);

            if (existing is null) return false;

            if (existing.RevokedAt == null)
            {
                existing.RevokedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }

            return true;
        }
        private async Task<(Models.Users.RefreshToken entity, string rawToken)> CreateRefreshTokenAsync(User user)
        {
            var raw = RefreshTokenUtil.GenerateToken();
            var hash = RefreshTokenUtil.HashToken(raw);

            var rt = new Models.Users.RefreshToken
            {
                UserId = user.Id,
                TokenHash = hash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };

            context.RefreshTokens.Add(rt);
            await context.SaveChangesAsync();
            return (rt, raw);

        }

        private static bool IsActive(Models.Users.RefreshToken rt) => rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow;
    }
}
