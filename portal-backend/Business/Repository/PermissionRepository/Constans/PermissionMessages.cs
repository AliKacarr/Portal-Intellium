using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.PermissionRepository.Constans
{
    public class PermissionMessages
    {
        public static string AddedPermission = "Kullanıcı izni başarıyla eklendi.";
        public static string UpdatedPermission = "Kullanıcı izni başarıyla güncellendi.";
        public static string DeletedPermission = "Kullanıcı izni başarıyla silindi.";
        public static string GetPermission = "Kullanıcı izni başarıyla listelendi.";
        public static string ConfirmPermission = "Kullanıcı izni başarıyla onaylandı";
        public static string DeclinePermission = "Kullanıcı izni reddedildi";
        public static string UserNotFound = "Kullanıcı bulunamadı";
        public static string NotFound = "Kullanıcı bulunamadı";
        public static string DontHavePermission = "Kullanıcının izin hakkı kalmadı";
        public static string OutOfRange = "Mazeret izni belirlenen günlerden fazla olamaz";
    }
}
