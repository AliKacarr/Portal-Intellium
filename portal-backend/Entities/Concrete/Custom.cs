using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class Custom
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public DayOfWeek[] SelectedDays { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string StartHours { get; set; }
        public string EndHours { get; set; }
        public string Description { get; set; }
    }
}
