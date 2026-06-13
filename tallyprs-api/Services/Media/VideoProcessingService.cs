using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.ComponentModel;
using System.Diagnostics;
using System.Text.Json;
using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.Data.Configurations;
using TallahasseePRs.Api.Models;
using TallahasseePRs.Api.Services.Storage;


namespace TallahasseePRs.Api.Services.Media
{
    public class VideoProcessingService : IVideoProcessingService
    {
        private readonly AppDbContext _db;
        private readonly IObjectStorage _storage;
        private readonly VideoProcessingOptions _options;
        private readonly ILogger<VideoProcessingService> _logger;

        public VideoProcessingService(
            AppDbContext db,
            IObjectStorage storage,
            IOptions<VideoProcessingOptions> options,
            ILogger<VideoProcessingService> logger)
        {
            _db = db;
            _storage = storage;
            _options = options.Value;
            _logger = logger;
        }

        public async Task ProcessAsync(Guid mediaId, CancellationToken cancellationToken = default)
        {
            var media = await _db.Media.FirstOrDefaultAsync(m => m.Id == mediaId, cancellationToken);

            if (media is null)
                throw new InvalidOperationException("Media not found.");

            if (media.Kind != MediaKind.Video)
                throw new InvalidOperationException("Media is not a video.");

            if (media.Status == MediaStatus.Ready || media.Status == MediaStatus.Deleted)
                throw new InvalidOperationException("Media cannot be processed in its current state.");

            if (media.Status == MediaStatus.Pending)
            {
                media.Status = MediaStatus.Processing;
                media.ProcessingStartedAt = DateTime.UtcNow;
                media.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
            }

            var tempRoot = Path.Combine(Path.GetTempPath(), "tallahasseeprs-video", media.Id.ToString());
            Directory.CreateDirectory(tempRoot);

            var inputPath = Path.Combine(tempRoot, "input" + GetExtensionFromContentType(media.ContentType));
            var outputPath = Path.Combine(tempRoot, "playback.mp4");
            var thumbnailPath = Path.Combine(tempRoot, "thumbnail.jpg");

            try
            {
                await using (var inputStream = await _storage.OpenReadAsync(media.ObjectKey, cancellationToken))
                await using (var fileStream = File.Create(inputPath))
                {
                    await inputStream.CopyToAsync(fileStream, cancellationToken);
                }

                var startedAt = DateTime.UtcNow;


                var isValidVideo = await IsValidVideoFileAsync(inputPath, cancellationToken);

                if (!isValidVideo)
                {
                    media.Status = MediaStatus.Failed;
                    media.ProcessingError = "Uploaded file does not contain a valid video stream.";
                    media.UpdatedAt = DateTime.UtcNow;

                    await _db.SaveChangesAsync(cancellationToken);

                    _logger.LogWarning(
                        "Video processing rejected invalid video file. MediaId={MediaId} ContentType={ContentType} FileName={FileName}",
                        media.Id,
                        media.ContentType,
                        media.OriginalFileName);

                    return;
                }

                _logger.LogInformation(
                    "Video processing started. MediaId={MediaId}",
                    mediaId);
                await RunFfmpegForPlaybackAsync(inputPath, outputPath, cancellationToken);
                _logger.LogInformation(
                    "Video playback file created. MediaId={MediaId}",
                    media.Id);

                Console.WriteLine("Starting thumbnail generation...");
                await RunFfmpegForThumbnailAsync(inputPath, thumbnailPath, cancellationToken);
                Console.WriteLine("Thumbnail generation finished.");

                var metadata = await ProbeVideoAsync(outputPath, cancellationToken);

                var playbackObjectKey = BuildPlaybackObjectKey(media);
                var thumbnailObjectKey = BuildThumbnailObjectKey(media);

                await using (var playbackStream = File.OpenRead(outputPath))
                {
                    await _storage.UploadViaPresignedUrlAsync(
                        playbackStream,
                        playbackObjectKey,
                        "video/mp4",
                        cancellationToken);
                }

                await using (var thumbnailStream = File.OpenRead(thumbnailPath))
                {
                     await _storage.UploadViaPresignedUrlAsync(
                         thumbnailStream,
                         thumbnailObjectKey,
                         "image/jpeg",
                         cancellationToken);
                }

                media.PlaybackObjectKey = playbackObjectKey;
                media.PlaybackContentType = "video/mp4";
                media.ThumbnailObjectKey = thumbnailObjectKey;

                media.Width = metadata.Width;
                media.Height = metadata.Height;
                media.DurationSeconds = metadata.DurationSeconds;

                media.Status = MediaStatus.Ready;
                media.ProcessedAt = DateTime.UtcNow;
                media.UpdatedAt = DateTime.UtcNow;
                media.ProcessingError = null;

                

                await _db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation(
                    "Video processing completed. MediaId={MediaId} DurationMs={DurationMs} Width={Width} Height={Height} DurationSeconds={DurationSeconds}",
                    media.Id,
                    (DateTime.UtcNow - startedAt).TotalMilliseconds,
                    media.Width,
                    media.Height,
                    media.DurationSeconds);
            }
            catch (Exception ex)
            {
                media.Status = MediaStatus.Failed;
                media.ProcessingError = "Video processing failed.";
                media.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(cancellationToken);

                _logger.LogError(
                    ex,
                    "Video processing failed safely. MediaId={MediaId}",
                    mediaId);

                return;
            }
            finally
            {
                try
                {
                    if (Directory.Exists(tempRoot))
                        Directory.Delete(tempRoot, recursive: true);

                    //Delete original
                    if (!string.IsNullOrWhiteSpace(media.ObjectKey))
                    {
                        var exists = await _storage.ExistsAsync(media.ObjectKey, cancellationToken);
                        if (exists)
                        {
                            await _storage.DeleteAsync(media.ObjectKey, cancellationToken);
                        }
                    }
                }
                catch
                {
                }
            }
        }

        private async Task RunFfmpegForPlaybackAsync(
            string inputPath,
            string outputPath,
            CancellationToken cancellationToken)
        {
            var scaleFilter =
                $"scale='min({_options.MaxPlaybackWidth},iw)':'min({_options.MaxPlaybackHeight},ih)':force_original_aspect_ratio=decrease," +
                "scale=trunc(iw/2)*2:trunc(ih/2)*2," +
                "fps=30";

            var args =
                $"-y -hide_banner -ignore_unknown -i \"{inputPath}\" " +

                // Use first video stream and first audio stream only.
                "-map 0:v:0 -map 0:a:0? " +

                // Drop data and subtitle streams.
                "-dn -sn " +

                $"-vf \"{scaleFilter}\" " +

                // Web/mobile-compatible video.
                "-c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p " +

                // Web/mobile-compatible audio.
                "-c:a aac -b:a 128k -ac 2 " +

                // Better web playback.
                "-movflags +faststart " +

                $"\"{outputPath}\"";

            await RunProcessAsync(_options.FfmpegPath, args, cancellationToken);
        }

        private async Task RunFfmpegForThumbnailAsync(
            string inputPath,
            string thumbnailPath,
            CancellationToken cancellationToken)
        {
            var args =
                $"-y -ss {_options.ThumbnailSecond} -i \"{inputPath}\" " +
                "-frames:v 1 -q:v 2 " +
                $"\"{thumbnailPath}\"";

            await RunProcessAsync(_options.FfmpegPath, args, cancellationToken);
        }

        private async Task<VideoProbeResult> ProbeVideoAsync(string filePath, CancellationToken cancellationToken)
        {
            var args = $"-v quiet -print_format json -show_streams -show_format \"{filePath}\"";

            var output = await RunProcessForOutputAsync(_options.FfprobePath, args, cancellationToken);

            using var doc = JsonDocument.Parse(output);

            var streams = doc.RootElement.GetProperty("streams");
            var videoStream = streams.EnumerateArray()
                .FirstOrDefault(x => x.TryGetProperty("codec_type", out var codecType) && codecType.GetString() == "video");

            int? width = null;
            int? height = null;

            if (videoStream.ValueKind != JsonValueKind.Undefined)
            {
                if (videoStream.TryGetProperty("width", out var widthEl))
                    width = widthEl.GetInt32();

                if (videoStream.TryGetProperty("height", out var heightEl))
                    height = heightEl.GetInt32();
            }

            double? duration = null;
            if (doc.RootElement.TryGetProperty("format", out var formatEl) &&
                formatEl.TryGetProperty("duration", out var durationEl) &&
                double.TryParse(durationEl.GetString(), out var parsedDuration))
            {
                duration = parsedDuration;
            }

            return new VideoProbeResult
            {
                Width = width,
                Height = height,
                DurationSeconds = duration
            };
        }

        private async Task RunProcessAsync(string fileName, string arguments, CancellationToken cancellationToken)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi)
                    ?? throw new InvalidOperationException($"Failed to start process: {fileName}");

                var stdOutTask = process.StandardOutput.ReadToEndAsync();
                var stdErrTask = process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync(cancellationToken);

                var stdOut = await stdOutTask;
                var stdErr = await stdErrTask;

                if (process.ExitCode != 0)
                {
                    throw new InvalidOperationException(
                        $"Process '{fileName}' failed with exit code {process.ExitCode}. Output: {stdOut} Error: {stdErr}");
                }
            }
            catch (Win32Exception ex)
            {
                throw new InvalidOperationException(
                    $"Could not start '{fileName}'. Make sure the configured path is correct.",
                    ex);
            }
        }

        private async Task<string> RunProcessForOutputAsync(string fileName, string arguments, CancellationToken cancellationToken)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = arguments,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi)
                    ?? throw new InvalidOperationException($"Failed to start process: {fileName}");

                var stdOutTask = process.StandardOutput.ReadToEndAsync();
                var stdErrTask = process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync(cancellationToken);

                var stdOut = await stdOutTask;
                var stdErr = await stdErrTask;

                if (process.ExitCode != 0)
                {
                    throw new InvalidOperationException(
                        $"Process '{fileName}' failed with exit code {process.ExitCode}. Error: {stdErr}");
                }

                return stdOut;
            }
            catch (Win32Exception ex)
            {
                throw new InvalidOperationException(
                    $"Could not start '{fileName}'. Make sure the configured path is correct.",
                    ex);
            }
        }

        private static string GetExtensionFromContentType(string contentType)
        {
            return contentType.ToLowerInvariant() switch
            {
                "video/mp4" => ".mp4",
                "video/webm" => ".webm",
                "video/quicktime" => ".mov",
                _ => ".bin"
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
        private async Task<bool> IsValidVideoFileAsync(
    string filePath,
    CancellationToken cancellationToken = default)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "ffprobe",
                Arguments = $"-v error -select_streams v:0 -show_entries stream=codec_type,codec_name -of json \"{filePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(startInfo);

            if (process == null)
                return false;

            var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            var error = await process.StandardError.ReadToEndAsync(cancellationToken);

            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogWarning(
                    "ffprobe failed while validating video. FilePath={FilePath} Error={Error}",
                    filePath,
                    error);

                return false;
            }

            return output.Contains("\"codec_type\":\"video\"")
                || output.Contains("\"codec_type\": \"video\"");
        }

        private sealed class VideoProbeResult
        {
            public int? Width { get; set; }
            public int? Height { get; set; }
            public double? DurationSeconds { get; set; }
        }
    }
}
