using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class UserPermission
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public double TotalLeave { get; set; } // Toplam izin gün 
        public double RemainingLeave { get; set; } // Kalan izin gün
        public double UsedLeave { get; set; } = 0; // Kullanılan izin gün
        public int ThisYear { get; set; }  // bu sene kazanacağı izin sayısı 
        public int Year { get; set; } // Yıl
    }
}
