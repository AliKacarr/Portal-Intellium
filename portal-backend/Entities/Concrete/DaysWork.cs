using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class DaysWork
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public DateTime Day { get; set; }
        public int Hour { get; set; }

    }
}
