using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.PermissionRepository
{
    public interface IPermissionService
    {
        IResult Add(Permission permission, IFormFile? documentFile);
        
        // GÜNCELLENDİ: Update artık dosya da alıyor
        IResult Update(Permission permission, IFormFile? documentFile);
        
        IDataResult<List<Permission>> GetAll();
        IResult Delete(Permission permission);
        IResult ConfirmPermission(int permissionId);

        // GÜNCELLENDİ: Reddetme sebebi eklendi
        IResult DeclinePermission(int permissionId, string reason);

        /// <summary>Kullanıcı yalnızca kendi Pending talebini siler.</summary>
        IResult CancelOwnPendingPermission(long userId, long permissionId);

        IDataResult<List<Permission>> GetByPermissionType(string permissionType);
        byte[] CreatePermissionPDF(int permissionId);
        IDataResult<Permission> GetById(int permissionId);
        IDataResult<List<Permission>> GetPermissionByUserId(long userId);
        /// <summary>Admin: tarih aralığında çakışan tüm izinler (kullanıcı + tip ismi ile).</summary>
        IDataResult<List<AdminCalendarEventDto>> GetAdminCalendarEvents(System.DateTime start, System.DateTime end);
    }
}