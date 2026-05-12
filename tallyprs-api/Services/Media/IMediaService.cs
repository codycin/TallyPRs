using TallahasseePRs.Api.DTOs.Media;

namespace TallahasseePRs.Api.Services.Media
{
    public interface IMediaService
    {
        Task<CreateMediaUploadResponse> CreateUploadAsync(
            Guid userId, 
            CreateMediaUploadRequest request, 
            CancellationToken cancellationToken = default);

        Task<MediaResponse?> GetByIdAsync(Guid mediaId, Guid userId, CancellationToken cancellationToken = default);

        Task<IReadOnlyList<MediaResponse>> GetForPostAsync(Guid postId, CancellationToken cancellationToken = default);

        Task<MediaResponse?> MarkUploadCompleteAsync(Guid mediaId, Guid userId, CancellationToken cancellationToken = default);

        Task DeleteAsync(Guid mediaId, Guid userId, bool isAdmin, CancellationToken cancellationToken= default);
        Task DeleteAsAdminAsync(Guid mediaId, CancellationToken cancellationToken = default);

    }
}
