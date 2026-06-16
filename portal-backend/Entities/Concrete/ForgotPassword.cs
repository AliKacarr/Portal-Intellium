using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class ForgotPassword
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public virtual User? User { get; set; }
        public string Value { get; set; }
        public DateTime SendDate { get; set; }
        public bool IsActive { get; set; }

    }
}
