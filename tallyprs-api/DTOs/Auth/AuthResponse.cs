namespace TallahasseePRs.Api.DTOs.Auth
{
    public sealed class AuthResponse
    {

        public UserResponse User { get; set; } = new UserResponse();
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;    

        public DateTime AccessTokenExpiration { get; set; }

    }
    public sealed class UserResponse
    {
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public Guid Id { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}
