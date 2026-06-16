using Core.Utilities.Results.Abstract;
using Entities.DTOs.RequestDtos;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.RequestRepository
{
    public interface IRequestService
    {
        IDataResult<List<RequestCategoryDto>> GetCategories();
        IDataResult<RequestCategoryDto> AddCategory(UpsertRequestCategoryDto dto);
        IDataResult<RequestCategoryDto> UpdateCategory(int id, UpsertRequestCategoryDto dto);
        IResult DeleteCategory(int id);
        IDataResult<RequestSubCategoryDto> AddSubCategory(UpsertRequestSubCategoryDto dto);
        IDataResult<RequestSubCategoryDto> UpdateSubCategory(int id, UpsertRequestSubCategoryDto dto);
        IResult DeleteSubCategory(int id);
        IDataResult<RequestSubCategoryFieldDto> AddSubCategoryField(UpsertRequestSubCategoryFieldDto dto);
        IDataResult<RequestSubCategoryFieldDto> UpdateSubCategoryField(int id, UpsertRequestSubCategoryFieldDto dto);
        IResult DeleteSubCategoryField(int id);
        IDataResult<RequestListItemDto> Create(CreateRequestDto dto);
        IDataResult<List<RequestListItemDto>> GetMyRequests(string? status = null);
        IDataResult<RequestDetailDto> GetMyRequestDetail(long id);
        Task<IDataResult<List<RequestAttachmentDto>>> AddAttachments(long requestId, List<IFormFile> attachments);
        IDataResult<(byte[] Bytes, string ContentType, string FileName)> DownloadMyAttachment(long requestId, long attachmentId);

        /// <summary>Admin/yetkili ekranı: istenirse kategori/status filtreli.</summary>
        IDataResult<List<RequestListItemDto>> GetInbox(string? status = null, int? categoryId = null);

        IDataResult<RequestListItemDto> UpdateStatus(long id, UpdateRequestStatusDto dto);
        /// <summary>Admin: beklemedeki talebi düzenler (gerekirse status günceller).</summary>
        IDataResult<RequestListItemDto> AdminUpdate(long id, UpdateRequestDto dto);
        /// <summary>Kullanıcı: sadece kendi taslağını günceller veya gönderir.</summary>
        IDataResult<RequestListItemDto> UpdateMyDraft(long id, UpdateRequestDto dto);
        IDataResult<RequestListItemDto> Cancel(long id, string? note = null);

        /// <summary>Kullanıcı: sadece kendi taslağını kalıcı siler.</summary>
        IResult DeleteMyDraft(long id);
        /// <summary>Admin: talebi kalıcı siler.</summary>
        IResult AdminDelete(long id);
    }
}

