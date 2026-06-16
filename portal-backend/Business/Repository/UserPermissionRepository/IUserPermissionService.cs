using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.UserPermissionRepository
{
    public interface IUserPermissionService
    {
        IResult Add(UserPermission userPermission);
        IResult Update(UserPermission userPermission);
        IDataResult<List<UserPermission>> GetAll();
        IResult Delete(UserPermission userPermission);

        // --- DÜZELTİLEN KISIM ---
        // Dönüş tipi IResult yerine IDataResult<UserPermission> oldu.
        // Böylece veriyi (izin günlerini) taşıyabilecek.
        IDataResult<UserPermission> GetUserPermissionById(int userId);

        IDataResult<LeaveEntitlementExplanationDto> GetLeaveEntitlementExplanation(int userId);

        // Admin'in manuel olarak bakiye değiştirmesi için özel metod
        // RecalculateFromJobAndProfile'i ÇAĞIRMAZ → Girilen değer aynen kaydedilir
        IResult AdminUpdateLeaveBalance(UserPermission userPermission);

    }
}