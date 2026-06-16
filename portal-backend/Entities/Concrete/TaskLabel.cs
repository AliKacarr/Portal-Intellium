using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class TaskLabel
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int LabelId { get; set; }
    }
}
