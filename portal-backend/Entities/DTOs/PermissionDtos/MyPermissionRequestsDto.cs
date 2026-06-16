using System.Collections.Generic;

namespace Entities.DTOs.PermissionDtos
{
    public class MyPermissionRequestsDto
    {
        public int PendingCount { get; set; }
        public int ApprovedCount { get; set; }
        public int RejectedCount { get; set; }
        public int TotalCount { get; set; }

        public List<MyPermissionRequestItemDto> Items { get; set; } = new();
    }
}

