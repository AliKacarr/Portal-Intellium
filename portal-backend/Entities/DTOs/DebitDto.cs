using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.DTOs
{
    public class DebitDto
    {
        public string Name { get; set; }
        public string Product { get; set; }
        public DateTime DeliveryDate { get; set; }
        public string PdfPath { get; set; }

    }
}
