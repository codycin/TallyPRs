using TallahasseePRs.Api.Models.Notifications;

namespace TallahasseePRs.Api.Models.Users;

public class User
{
    public Guid Id { get; set; }   
    public string Email { get; set; } = "";
    public string UserName { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Member";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Follow> Following { get; set; } = new List<Follow>();
    public ICollection<Follow> Followers { get; set; } = new List<Follow>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Notification> ReceivedNotifications { get; set; } = new List<Notification>();
    public ICollection<Notification> SentNotifications { get; set; } = new List<Notification>();
}



