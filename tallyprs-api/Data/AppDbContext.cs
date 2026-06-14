using Microsoft.EntityFrameworkCore;
using TallahasseePRs.Api.Models;
using TallahasseePRs.Api.Models.Messages;
using TallahasseePRs.Api.Models.Notifications;
using TallahasseePRs.Api.Models.Posts;
using TallahasseePRs.Api.Models.Users;

namespace TallahasseePRs.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Profile>  Profiles => Set<Profile>();
    public DbSet<Lift> Lifts => Set<Lift>();
    public DbSet<PRPost> Posts => Set<PRPost>();
    public DbSet<Vote> Votes => Set<Vote>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Media> Media => Set<Media>();

    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();

    public DbSet<Message> Messages => Set<Message>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        //Profile
        modelBuilder.Entity<Profile>()
            .HasKey(p => p.UserId);

        modelBuilder.Entity<Profile>()
            .HasOne(p => p.User)
            .WithOne()
            .HasForeignKey<Profile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasOne(p => p.ProfilePicture)
                  .WithMany()
                  .HasForeignKey(p => p.ProfilePictureId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // PR POSTS
        modelBuilder.Entity<PRPost>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // COMMENTS
        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.PRPost)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PRPostId)
            .OnDelete(DeleteBehavior.Cascade);

        // SELF REFERENCING REPLIES
        modelBuilder.Entity<Comment>()
            .HasMany(c => c.Replies)
            .WithOne(c => c.ParentComment)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade);

        // VOTES
        modelBuilder.Entity<Vote>()
            .HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Vote>()
            .HasOne(v => v.PRPost)
            .WithMany()
            .HasForeignKey(v => v.PRPostId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Vote>()
      .HasIndex(v => new { v.PRPostId, v.UserId })
      .IsUnique();

        // FOLLOWS
        modelBuilder.Entity<Follow>()
            .HasOne(f => f.FollowerUser)
            .WithMany(u => u.Following)
            .HasForeignKey(f => f.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Follow>()
            .HasOne(f => f.FollowedUser)
            .WithMany(u => u.Followers)
            .HasForeignKey(f => f.FollowedId)
            .OnDelete(DeleteBehavior.Restrict);

        // REFRESH TOKENS
        modelBuilder.Entity<RefreshToken>()
         .HasOne(r => r.User)
         .WithMany(u => u.RefreshTokens)
         .HasForeignKey(r => r.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.TokenHash)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.UserId);

        // NOTIFICATIONS
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);

            entity.Property(n => n.Message)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(n => n.Type)
                .IsRequired();

            entity.Property(n => n.IsRead)
                .IsRequired();

            entity.Property(n => n.CreatedAt)
                .IsRequired();

            entity.HasOne(n => n.Recipient)
                .WithMany(u => u.ReceivedNotifications)
                .HasForeignKey(n => n.RecipientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Actor)
                .WithMany(u => u.SentNotifications)
                .HasForeignKey(n => n.ActorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(n => n.Post)
                 .WithMany(p => p.Notifications)
                 .HasForeignKey(n => n.PostId)
                 .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(n => n.Comment)
                .WithMany(c => c.Notifications)
                .HasForeignKey(n => n.CommentId)
                .OnDelete(DeleteBehavior.SetNull);
        });
        // MEDIA
        modelBuilder.Entity<Media>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.Property(m => m.StorageProvider)
                .HasMaxLength(50);

            entity.Property(m => m.Bucket)
                .HasMaxLength(200);

            entity.Property(m => m.ObjectKey)
                .HasMaxLength(1024)
                .IsRequired();

            entity.Property(m => m.OriginalFileName)
                .HasMaxLength(255);

            entity.Property(m => m.ContentType)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(m => m.Sha256Hash)
                .HasMaxLength(128);

            entity.Property(m => m.ETag)
                .HasMaxLength(128);

            entity.Property(m => m.ThumbnailObjectKey)
                .HasMaxLength(1024);

            entity.HasIndex(m => m.OwnerId);
            entity.HasIndex(m => m.PostId);
            entity.HasIndex(m => m.CommentId);
            entity.HasIndex(m => m.ProfileId);
            entity.HasIndex(m => m.CreatedAt);
            entity.HasIndex(m => m.Sha256Hash);

            entity.HasOne(m => m.Owner)
                .WithMany()
                .HasForeignKey(m => m.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.Post)
                .WithMany(p => p.MediaItems)
                .HasForeignKey(m => m.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.Comment)
                .WithMany(c => c.MediaItems)
                .HasForeignKey(m => m.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

        });


        //Indexing

        // POSTS 
        modelBuilder.Entity<PRPost>()
            .HasIndex(p => new { p.CreatedAt, p.Id });

        modelBuilder.Entity<PRPost>()
            .HasIndex(p => new { p.UserId, p.CreatedAt, p.Id });

        modelBuilder.Entity<PRPost>()
            .HasIndex(p => p.LiftId);

        modelBuilder.Entity<PRPost>()
            .HasIndex(p => p.Status);

        // COMMENTS 
        modelBuilder.Entity<Comment>()
            .HasIndex(c => c.PRPostId);

        modelBuilder.Entity<Comment>()
            .HasIndex(c => c.UserId);

        modelBuilder.Entity<Comment>()
            .HasIndex(c => c.ParentCommentId);

        // VOTES 
        modelBuilder.Entity<Vote>()
            .HasIndex(v => v.PRPostId);


        // FOLLOWS 
        modelBuilder.Entity<Follow>()
            .HasIndex(f => f.FollowerId);

        modelBuilder.Entity<Follow>()
            .HasIndex(f => f.FollowedId);

        modelBuilder.Entity<Follow>()
            .HasIndex(f => new { f.FollowerId, f.FollowedId })
            .IsUnique();

        // NOTIFICATIONS 
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.RecipientId, n.IsRead, n.CreatedAt });

        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.PostId);

        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.CommentId);

        // LIFTS 
        modelBuilder.Entity<Lift>()
            .HasIndex(l => l.Name);

        modelBuilder.Entity<Lift>()
            .HasIndex(l => l.Category);

        // PROFILES 
        modelBuilder.Entity<Profile>()
            .HasIndex(p => p.DisplayName);

        //MESSAGING
        modelBuilder.Entity<ConversationParticipant>()
        .HasKey(x => new { x.ConversationId, x.UserId });

        modelBuilder.Entity<ConversationParticipant>()
            .HasOne(x => x.Conversation)
            .WithMany(x => x.Participants)
            .HasForeignKey(x => x.ConversationId);

        modelBuilder.Entity<Message>()
            .HasOne(x => x.Conversation)
            .WithMany(x => x.Messages)
            .HasForeignKey(x => x.ConversationId);

    }


}