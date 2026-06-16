using System.ComponentModel.DataAnnotations;

namespace Entities.Concrete
{
    public class OperationClaim
    {
        [Key]
        public long Id { get; set; }
        public string Name { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    }
}
