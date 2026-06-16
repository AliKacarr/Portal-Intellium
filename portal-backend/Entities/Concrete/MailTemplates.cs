using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Concrete
{
    public class MailTemplates
    {
        public int Id { get; set; }
        public long CustomerId { get; set; }
        
        public string Type { get; set; } //Kayıt-Silme-güncelleme vs.
        public string Value { get; set; }
    }
}
