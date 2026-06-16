using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class LeaveDeducation
    {
        public int Id { get; set; }
        public string PermissionType { get; set; }
        public int MaxDay { get; set; }
    }
}
