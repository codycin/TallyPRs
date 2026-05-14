using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.Data.Configurations;
using TallahasseePRs.Api.DTOs.Media;
using TallahasseePRs.Api.Models;
using TallahasseePRs.Api.Services.Storage;

namespace TallahasseePRs.Api.Services.Media
{
    public class MediaService : IMediaService
    {
        private static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
            "image/heic-sequence",
            "image/heif-sequence"
        };

        private static readonly HashSet<string> AllowedVideoTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "video/mp4",
            "video/webm",
            "video/quicktime"
        };
        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".heic",
            ".heif"
        };

        private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".mp4",
            ".webm",
            ".mov"
        };
        private static readonly HashSet<string> AllowedMediaExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".heic",
            ".heif",
            ".mp4",
            ".webm",
            ".mov"
        };

        private readonly AppDbContext _db;
        private readonly IObjectStorage _storage;
        private readonly R2Options _r2Options;
        private readonly MediaOptions _mediaOptions;
        private readonly IVideoProcessingService _videoProcessingService;
        private readonly ILogger<MediaService> _logger;

        public MediaService(
            AppDbContext db,
            IObjectStorage storage,
            IOptions<R2Options> r2Options,
            IOptions<MediaOptions> mediaOptions,
            IVideoProcessingService videoProcessingService,
            ILogger<MediaService> logger)
        {
            _db = db;
            _storage = storage;
            _r2Options = r2Options.Value;
            _mediaOptions = mediaOptions.Value;
            _videoProcessingService = videoProcessingService;
            _logger = logger;

        }
        private static string NormalizeContentType(string contentType, string fileName, MediaKind kind)
        {
            var normalized = contentType.Trim().ToLowerInvariant();
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            if (AllowedImageTypes.Contains(normalized) || AllowedVideoTypes.Contains(normalized))
                return normalized;

            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".heic" => "image/heic",
                ".heif" => "image/heif",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".mov" => "video/quicktime",
                _ => throw new InvalidOperationException("Unsupported file type.")
            };
        }

        public async Task<CreateMediaUploadResponse> CreateUploadAsync(
            Guid userId,
            CreateMediaUploadRequest request,
            CancellationToken cancellationToken = default)
        {
            ValidateRequest(request);

            var kind = DetermineKind(request.ContentType, request.FileName);
            var normalizedContentType = NormalizeContentType(request.ContentType, request.FileName, kind);

            ValidateAllowedContentType(kind, normalizedContentType, request.FileName);
            ValidateFileSize(kind, request.Purpose, request.SizeBytes);

            await ValidateTargetOwnershipAsync(userId, request, cancellationToken);
            await ValidatePurposeLimitsAsync(userId, request, kind, cancellationToken);

            var mediaId = Guid.NewGuid();
            var objectKey = BuildObjectKey(userId, mediaId, request, kind, normalizedContentType);

            var media = new Models.Media
            {
                Id = mediaId,
                OwnerId = userId,
                Kind = kind,
                Purpose = request.Purpose,
                Status = MediaStatus.Pending,

                StorageProvider = "cloudflare-r2",
                Bucket = _r2Options.BucketName,
                ObjectKey = objectKey,

                OriginalFileName = request.FileName,
                ContentType = normalizedContentType,
                SizeBytes = request.SizeBytes,

                PostId = request.PostId,
                CommentId = request.CommentId,
                ProfileId = request.ProfileId,

                CreatedAt = DateTime.UtcNow
            };

            _db.Media.Add(media);
            await _db.SaveChangesAsync(cancellationToken);

            var presigned = await _storage.CreatePresignedUploadAsync(
                objectKey,
                normalizedContentType,
                TimeSpan.FromMinutes(10),
                cancellationToken);

            _logger.LogInformation(
                "Media upload initialized. MediaId={MediaId} UserId={UserId} Kind={Kind} Purpose={Purpose} SizeBytes={SizeBytes} ContentType={ContentType}",
                media.Id,
                userId,
                media.Kind,
                media.Purpose,
                media.SizeBytes,
                media.ContentType);

            return new CreateMediaUploadResponse
            {
                MediaId = media.Id,
                UploadUrl = presigned.Url,
                ExpiresAtUtc = presigned.ExpiresAtUtc,
                ObjectKey = media.ObjectKey
            };
        }

        public async Task<MediaResponse?> GetByIdAsync(Guid mediaId, Guid userId, CancellationToken cancellationToken = default)
        {
            var media = await _db.Media.AsNoTracking().
                FirstOrDefaultAsync(m=>m.Id == mediaId && m.OwnerId == userId, cancellationToken);

            return media is null ? null : ToResponse(media);

        }

        public async Task<IReadOnlyList<MediaResponse>> GetForPostAsync(Guid postId, CancellationToken cancellationToken = default)
        {
            var mediaItems = await _db.Media
                .AsNoTracking()
                .Where(m => m.PostId == postId && m.Status == MediaStatus.Ready)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            return mediaItems.Select(m => ToResponse(m)).ToList();
        }

        public async Task<MediaResponse?> MarkUploadCompleteAsync(Guid mediaId, Guid userId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Media upload complete requested. MediaId={MediaId} UserId={UserId}",
                mediaId,
                userId);

            var media = await _db.Media
                .FirstOrDefaultAsync(m => m.Id == mediaId && m.OwnerId == userId, cancellationToken);

            if (media is null)
            {
                _logger.LogWarning(
                    "Media upload complete failed because media was not found. MediaId={MediaId} UserId={UserId}",
                    mediaId,
                    userId);
                return null;
            }


            if (media.Status != MediaStatus.Pending)
                throw new InvalidOperationException("Media upload is not pending.");

            var exists = await _storage.ExistsAsync(media.ObjectKey, cancellationToken);

            _logger.LogInformation(
                "Media storage existence check completed. MediaId={MediaId} ObjectKey={ObjectKey} Exists={Exists}",
                media.Id,
                media.ObjectKey,
                exists);

            if (!exists)
                throw new InvalidOperationException("Uploaded file was not found in storage");

            media.UploadedAt = DateTime.UtcNow;
            media.UpdatedAt = DateTime.UtcNow;

            if (media.Kind == MediaKind.Image)
            {
                media.Status = MediaStatus.Ready;
                await _db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation(
                    "Media upload marked complete. MediaId={MediaId} Kind={Kind} Status={Status}",
                    media.Id,
                    media.Kind,
                    media.Status);
                return ToResponse(media);
            } 
            if (media.Kind == MediaKind.Video)
            {
                media.Status = MediaStatus.Processing;
                media.ProcessingStartedAt = DateTime.UtcNow;
                media.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(cancellationToken);
                
                await _videoProcessingService.ProcessAsync(media.Id, cancellationToken);

                var updated = await _db.Media
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.Id == media.Id && m.OwnerId == userId, cancellationToken);

                if (updated != null)
                {
                    _logger.LogInformation(
                        "Media upload marked complete. MediaId={MediaId} Kind={Kind} Status={Status}",
                        media.Id,
                        media.Kind,
                        media.Status);
                }

                return updated is null ? null : ToResponse(updated);
            }
            throw new InvalidOperationException("Unsupported media kind.");
        }


        public async Task DeleteAsync(Guid mediaId, Guid userId, bool isAdmin, CancellationToken cancellationToken = default)
        {
            Models.Media? media;
            if(isAdmin)
            {
                media = await _db.Media
                .FirstOrDefaultAsync(m => m.Id == mediaId , cancellationToken);
            }
            else
            {
                media = await _db.Media
                .FirstOrDefaultAsync(m => m.Id == mediaId && m.OwnerId == userId, cancellationToken);
            }
            

            var mediaDebug = await _db.Media
                .AsNoTracking()
                .Where(m => m.Id == mediaId)
                .Select(m => new
                {
                    m.Id,
                    m.OwnerId,
                    m.ObjectKey,
                    m.ThumbnailObjectKey,
                    m.PlaybackObjectKey,
                    m.Status
                })
                .FirstOrDefaultAsync(cancellationToken);

            _logger.LogInformation(
                "DeleteAsync debug. MediaId={MediaId}, RequestUserId={UserId}, MediaOwnerId={OwnerId}, Found={Found}",
                mediaId,
                userId,
                mediaDebug != null ? mediaDebug.OwnerId : null,
                mediaDebug != null);

            if (media is null)
            {
                _logger.LogWarning(
                    "Media delete failed because media was not found. MediaId={MediaId} UserId={UserId}",
                    mediaId,
                    userId);
                throw new InvalidOperationException("Media not found.");

            }

            if (media.Status == MediaStatus.Deleted)
                return;

            if (!string.IsNullOrWhiteSpace(media.ObjectKey))
            {
                var exists = await _storage.ExistsAsync(media.ObjectKey, cancellationToken);
                if (exists)
                {
                    await _storage.DeleteAsync(media.ObjectKey, cancellationToken);
                }
            }

            if (!string.IsNullOrWhiteSpace(media.ThumbnailObjectKey))
            {
                var thumbExists = await _storage.ExistsAsync(media.ThumbnailObjectKey, cancellationToken);
                if (thumbExists)
                {
                    await _storage.DeleteAsync(media.ThumbnailObjectKey, cancellationToken);
                }
            }
            if (!string.IsNullOrWhiteSpace(media.PlaybackObjectKey))
            {
                var playbackExists = await _storage.ExistsAsync(media.PlaybackObjectKey, cancellationToken);
                if (playbackExists)
                {
                    await _storage.DeleteAsync(media.PlaybackObjectKey, cancellationToken);
                }
            }

            media.Status = MediaStatus.Deleted;
            media.DeletedAt = DateTime.UtcNow;
            media.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "Media deleted. MediaId={MediaId} UserId={UserId}",
                media.Id,
                userId);

            await _db.SaveChangesAsync(cancellationToken);
        }
        public async Task DeleteAsAdminAsync(Guid mediaId, CancellationToken cancellationToken = default)
        {
            var media = await _db.Media.FirstOrDefaultAsync(m => m.Id == mediaId, cancellationToken);
            if (media == null) return;

            var isStillUsed =
                await _db.Profiles.AnyAsync(p => p.ProfilePictureId == media.Id, cancellationToken);

            if (isStillUsed)
                return;

            if (!string.IsNullOrWhiteSpace(media.ObjectKey))
            {
                var exists = await _storage.ExistsAsync(media.ObjectKey, cancellationToken);
                if (exists)
                {
                    await _storage.DeleteAsync(media.ObjectKey, cancellationToken);
                }
            }

            if (!string.IsNullOrWhiteSpace(media.ThumbnailObjectKey))
            {
                var thumbExists = await _storage.ExistsAsync(media.ThumbnailObjectKey, cancellationToken);
                if (thumbExists)
                {
                    await _storage.DeleteAsync(media.ThumbnailObjectKey, cancellationToken);
                }
            }
            if (!string.IsNullOrWhiteSpace(media.PlaybackObjectKey))
            {
                var playbackExists = await _storage.ExistsAsync(media.PlaybackObjectKey, cancellationToken);
                if (playbackExists)
                {
                    await _storage.DeleteAsync(media.PlaybackObjectKey, cancellationToken);
                }
            }

            _db.Media.Remove(media);
            await _db.SaveChangesAsync(cancellationToken);
        }
        private static MediaKind DetermineKind(string contentType, string fileName)
        {
            var normalizedContentType = contentType.Trim().ToLowerInvariant();
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            if (
                normalizedContentType.StartsWith("image/") ||
                extension is ".jpg" or ".jpeg" or ".png" or ".webp" or ".heic" or ".heif"
            )
            {
                return MediaKind.Image;
            }

            if (
                normalizedContentType.StartsWith("video/") ||
                extension is ".mp4" or ".webm" or ".mov"
            )
            {
                return MediaKind.Video;
            }

            throw new InvalidOperationException("Unsupported media type.");
        }

        private static void ValidateRequest(CreateMediaUploadRequest request)
        {
            if(request is null)
                throw new ArgumentNullException(nameof(request));

            if (string.IsNullOrWhiteSpace(request.FileName))
                throw new InvalidOperationException("File name is required.");

            if (string.IsNullOrWhiteSpace(request.ContentType))
                throw new InvalidOperationException("Content type is required.");

            if (request.SizeBytes <= 0)
                throw new InvalidOperationException("File must not be empty.");
        }

        private static void ValidateAllowedContentType(
            MediaKind kind,
            string contentType,
            string fileName)
        {
            var extension = Path.GetExtension(fileName);

            var isAllowed = kind switch
            {
                MediaKind.Image =>
                    AllowedImageTypes.Contains(contentType) ||
                    AllowedImageExtensions.Contains(extension),

                MediaKind.Video =>
                    AllowedVideoTypes.Contains(contentType) ||
                    AllowedVideoExtensions.Contains(extension),

                _ => false
            };

            if (!isAllowed)
                throw new InvalidOperationException("Unsupported file type.");
        }
        private void ValidateFileSize(MediaKind kind, MediaPurpose purpose, long sizeBytes)
        {
            if (sizeBytes <= 0)
                throw new InvalidOperationException("File must not be empty.");

            switch (purpose)
            {
                case MediaPurpose.ProfilePicture:
                    if (kind != MediaKind.Image)
                        throw new InvalidOperationException("Profile avatars must be images.");

                    if (sizeBytes > _mediaOptions.MaxAvatarBytes)
                        throw new InvalidOperationException("Avatar file is too large.");
                    break;


                case MediaPurpose.Post:
                case MediaPurpose.Comment:
                    if (kind == MediaKind.Image && sizeBytes > _mediaOptions.MaxImageBytes)
                        throw new InvalidOperationException("Image file is too large.");

                    if (kind == MediaKind.Video && sizeBytes > _mediaOptions.MaxVideoBytes)
                        throw new InvalidOperationException("Video file is too large.");
                    break;

                default:
                    throw new InvalidOperationException("Invalid media purpose.");
            }

        }
        private async Task ValidateTargetOwnershipAsync(
            Guid userId,
            CreateMediaUploadRequest request,
            CancellationToken cancellationToken)
        {
            switch (request.Purpose)
            {
                case MediaPurpose.Post:
                    if (request.PostId.HasValue)
                    {
                        var ownsPost = await _db.Posts
                            .AnyAsync(p => p.Id == request.PostId.Value && p.UserId == userId, cancellationToken);

                        if (!ownsPost)
                            throw new InvalidOperationException("Post not found or not owned by current user.");
                    }
                    break;

                case MediaPurpose.Comment:
                    if (request.CommentId.HasValue)
                    {
                        var ownsComment = await _db.Comments
                            .AnyAsync(c => c.Id == request.CommentId.Value && c.UserId == userId, cancellationToken);

                        if (!ownsComment)
                            throw new InvalidOperationException("Comment not found or not owned by current user.");
                    }
                    break;

                case MediaPurpose.ProfilePicture:
                    if (request.ProfileId.HasValue)
                    {
                        var ownsProfile = await _db.Profiles
                            .AnyAsync(p => p.UserId == request.ProfileId.Value && p.UserId == userId, cancellationToken);

                        if (!ownsProfile)
                            throw new InvalidOperationException("Profile not found or not owned by current user.");
                    }
                    break;
            }

        }
        private async Task ValidatePurposeLimitsAsync(
           Guid userId,
           CreateMediaUploadRequest request,
           MediaKind kind,
           CancellationToken cancellationToken)
        {
            if (request.Purpose == MediaPurpose.Post && request.PostId.HasValue)
            {
                var videoCount = await _db.Media
                    .CountAsync(m =>
                        m.PostId == request.PostId.Value &&
                        m.Status != MediaStatus.Deleted &&
                        m.Kind == MediaKind.Video,
                        cancellationToken);

                var imageCount = await _db.Media
                    .CountAsync(m =>
                        m.PostId == request.PostId.Value &&
                        m.Status != MediaStatus.Deleted &&
                        m.Kind == MediaKind.Image,
                        cancellationToken);

                if (kind == MediaKind.Video && videoCount >= _mediaOptions.MaxPostVideoCount)
                    throw new InvalidOperationException("Post video limit reached.");

                if (kind == MediaKind.Image && imageCount >= _mediaOptions.MaxPostImageCount)
                    throw new InvalidOperationException("Post image limit reached.");


            }

            if (request.Purpose == MediaPurpose.ProfilePicture && request.ProfileId.HasValue)
            {
                //Fallback, delete all of this media since it shouldnt exist
                await DeleteExistingProfilePictureMediaAsync(
                    request.ProfileId.Value,
                    userId,
                    cancellationToken);
            }

        }
        private async Task DeleteExistingProfilePictureMediaAsync(
            Guid profileId,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var existingMedia = await _db.Media
                .Where(m =>
                    m.OwnerId == userId &&
                    m.Purpose == MediaPurpose.ProfilePicture &&
                    m.Status != MediaStatus.Deleted)
                .ToListAsync(cancellationToken);

            foreach (var media in existingMedia)
            {
                // Delete object from storage first if it exists.
                try
                {
                    await _storage.DeleteAsync(media.ObjectKey, cancellationToken);

                    if (!string.IsNullOrWhiteSpace(media.ThumbnailObjectKey))
                    {
                        await _storage.DeleteAsync(media.ThumbnailObjectKey, cancellationToken);
                    }
                }
                catch
                {
                    _logger.LogWarning(
                        "Failed to delete media object from storage during profile picture update. MediaId={MediaId} ObjectKey={ObjectKey}",
                        media.Id,
                        media.ObjectKey);
                }

                media.Status = MediaStatus.Deleted;
                media.UpdatedAt = DateTime.UtcNow;
                media.ProfileId = null;
            }
        }

        private static string BuildObjectKey(
            Guid userId,
            Guid mediaId,
            CreateMediaUploadRequest request,
            MediaKind kind,
            string normalizedContentType)
        {
            var extension = GetExtensionForContentType(normalizedContentType, request.FileName);

            return request.Purpose switch
            {
                MediaPurpose.Post => request.PostId.HasValue
                    ? $"users/{userId}/posts/{request.PostId.Value}/media/{mediaId}{extension}"
                    : $"users/{userId}/posts/unattached/media/{mediaId}{extension}",

                MediaPurpose.Comment => request.CommentId.HasValue
                    ? $"users/{userId}/comments/{request.CommentId.Value}/media/{mediaId}{extension}"
                    : $"users/{userId}/comments/unattached/media/{mediaId}{extension}",

                MediaPurpose.ProfilePicture =>
                    $"users/{userId}/profile/picture/{mediaId}{extension}",

                _ => throw new InvalidOperationException("Invalid media purpose.")
            };
        }
        private static string BuildPlaybackObjectKey(Models.Media media)
        {
            return media.Purpose switch
            {
                MediaPurpose.Post => media.PostId.HasValue
                    ? $"users/{media.OwnerId}/posts/{media.PostId.Value}/media/{media.Id}/playback.mp4"
                    : $"users/{media.OwnerId}/posts/unattached/media/{media.Id}/playback.mp4",

                MediaPurpose.Comment => media.CommentId.HasValue
                    ? $"users/{media.OwnerId}/comments/{media.CommentId.Value}/media/{media.Id}/playback.mp4"
                    : $"users/{media.OwnerId}/comments/unattached/media/{media.Id}/playback.mp4",

                _ => throw new InvalidOperationException("Playback video is only supported for post/comment media.")
            };
        }
        private static string BuildThumbnailObjectKey(Models.Media media)
        {
            return media.Purpose switch
            {
                MediaPurpose.Post => media.PostId.HasValue
                    ? $"users/{media.OwnerId}/posts/{media.PostId.Value}/media/{media.Id}/thumbnail.jpg"
                    : $"users/{media.OwnerId}/posts/unattached/media/{media.Id}/thumbnail.jpg",

                MediaPurpose.Comment => media.CommentId.HasValue
                    ? $"users/{media.OwnerId}/comments/{media.CommentId.Value}/media/{media.Id}/thumbnail.jpg"
                    : $"users/{media.OwnerId}/comments/unattached/media/{media.Id}/thumbnail.jpg",

                _ => throw new InvalidOperationException("Thumbnail is only supported for post/comment media.")
            };
        }

        private static string GetExtensionForContentType(string contentType, string fileName)
        {
            var normalizedContentType = contentType.Trim().ToLowerInvariant();
            var originalExtension = Path.GetExtension(fileName).ToLowerInvariant();

            var extension = normalizedContentType switch
            {
                "image/jpeg" => ".jpg",
                "image/jpg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/heic" => ".heic",
                "image/heif" => ".heif",
                "image/heic-sequence" => ".heic",
                "image/heif-sequence" => ".heif",

                "video/mp4" => ".mp4",
                "video/webm" => ".webm",
                "video/quicktime" => ".mov",

                _ => originalExtension
            };

            if (!AllowedMediaExtensions.Contains(extension))
                throw new InvalidOperationException("Unsupported file extension.");

            return extension;
        }

        private MediaResponse ToResponse(Models.Media media)
        {
            string url = "";

            if (media.Kind == MediaKind.Image)
            {
                url = _storage.GetPublicUrl(media.ObjectKey);
            }
            else if (media.Kind == MediaKind.Video)
            {
                if (media.Status == MediaStatus.Ready && !string.IsNullOrWhiteSpace(media.PlaybackObjectKey))
                {
                    url = _storage.GetPublicUrl(media.PlaybackObjectKey);
                }
            }

            return new MediaResponse
            {
                Id = media.Id,
                Url = url,
                ThumbnailUrl = !string.IsNullOrWhiteSpace(media.ThumbnailObjectKey)
                    ? _storage.GetPublicUrl(media.ThumbnailObjectKey)
                    : null,

                Kind = media.Kind.ToString(),
                Purpose = media.Purpose.ToString(),
                Status = media.Status.ToString(),

                OriginalFileName = media.OriginalFileName,
                ContentType = media.ContentType,
                SizeBytes = media.SizeBytes,

                Width = media.Width,
                Height = media.Height,
                DurationSeconds = media.DurationSeconds,

                CreatedAt = media.CreatedAt
            };
        }
    }

}


