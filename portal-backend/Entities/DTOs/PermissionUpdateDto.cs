using Microsoft.AspNetCore.Http;
using System;

namespace Entities.DTOs
{
    public class PermissionUpdateDto
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public int PermissionTypeId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Description { get; set; }
        public string? DocumentPath { get; set; } // Mevcut dosya yolu
        public IFormFile? DocumentFile { get; set; } // Yeni yüklenen dosya (varsa)
    }
}