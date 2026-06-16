using Business.Repository.PermissionRepository;
using Core.Identity;
using Entities.Concrete;
using Entities.DTOs; 
using Entities.DTOs.PermissionDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace WebApi.Controllers
{
    [Route("api/permission")]
    [ApiController]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        private readonly IUserContext _userContext;

        public PermissionController(IPermissionService permissionService, IUserContext userContext)
        {
            _permissionService = permissionService;
            _userContext = userContext;
        }

        [HttpPost("add")]
        public IActionResult Add([FromForm] Permission permission, [FromForm] IFormFile? documentFile)
        {
            var result = _permissionService.Add(permission, documentFile);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getPermission")]
        public IActionResult GetPermission()
        {
            var result = _permissionService.GetAll();
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPatch("confirmPermission")]
        public IActionResult ConfirmPermission(int permissionId)
        {
            var result = _permissionService.ConfirmPermission(permissionId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPatch("declinePermission")]
        public IActionResult DeclinePermission(int permissionId, string reason)
        {
            var result = _permissionService.DeclinePermission(permissionId, reason);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>Kullanıcı kendi onay bekleyen izin talebini iptal eder (kayıt silinir).</summary>
        [HttpDelete("cancelPending")]
        public IActionResult CancelOwnPending([FromQuery] long userId, [FromQuery] long permissionId)
        {
            var result = _permissionService.CancelOwnPendingPermission(userId, permissionId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromForm] PermissionUpdateDto permissionDto)
        {
            var permission = new Permission
            {
                Id = permissionDto.Id,
                UserId = permissionDto.UserId,
                PermissionTypeId = permissionDto.PermissionTypeId,
                StartTime = permissionDto.StartTime,
                EndTime = permissionDto.EndTime,
                PhoneNumber = permissionDto.PhoneNumber,
                Address = permissionDto.Address,
                Description = permissionDto.Description,
                DocumentPath = permissionDto.DocumentPath
            };

            var result = _permissionService.Update(permission, permissionDto.DocumentFile);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getByPermissionType")]
        public IActionResult GetByPermissionType(string permissionType)
        {
            var result = _permissionService.GetByPermissionType(permissionType);
            return result.Success ? Ok(result) : NotFound(result);
        }

        // --- GÜNCELLENEN KISIM: PDF'İ YENİ SEKMEDE AÇMA (INLINE) ---
        [HttpGet("download-pdf/{permissionId}")]
        public IActionResult DownloadPdf(int permissionId)
        {
            try
            {
                byte[] fileBytes = _permissionService.CreatePermissionPDF(permissionId);
                
                if (fileBytes == null || fileBytes.Length == 0)
                {
                    return NotFound("PDF verisi oluşturulamadı.");
                }

                string fileName = $"Izin_Formu_{permissionId}.pdf";

                // "inline" diyerek tarayıcının dosyayı yeni sekmede açmasını sağlıyoruz.
                // filename=... diyerek kullanıcı "Kaydet" derse ismin düzgün gelmesini sağlıyoruz.
                Response.Headers.Add("Content-Disposition", $"inline; filename={fileName}");

                // 3. parametre (fileName) VERİLMİYOR. Verilirse zorla indirir.
                return File(fileBytes, "application/pdf");
            }
            catch (Exception ex)
            {
                return BadRequest($"PDF hatası: {ex.Message}");
            }
        }
        // -----------------------------------------------------------

        [HttpGet("getPermissionByUserId")]
        public IActionResult GetByPermissionByUserId(long userId)
        {
            var result = _permissionService.GetPermissionByUserId(userId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>
        /// Kullanıcının kendi izin taleplerini (Beklemede/Onaylanan/Reddedilen) özet + liste olarak döner.
        /// Frontend dashboard için: tek istekle sayılar + "bildirim" detayı.
        /// </summary>
        [HttpGet("my-requests")]
        public IActionResult GetMyPermissionRequests([FromQuery] string? status = null)
        {
            if (!_userContext.IsAuthenticated) return Unauthorized();

            var res = _permissionService.GetPermissionByUserId(_userContext.UserId);
            if (!res.Success || res.Data == null) return Ok(new MyPermissionRequestsDto());

            var items = res.Data ?? new List<Permission>();

            // Normalize status: Pending/Approved/Rejected (DB'de farklı değerler varsa map'le)
            static string NormStatus(Permission p)
            {
                var s = (p.Status ?? string.Empty).Trim();
                if (string.Equals(s, "Pending", StringComparison.OrdinalIgnoreCase)) return "Pending";
                if (string.Equals(s, "Approved", StringComparison.OrdinalIgnoreCase)) return "Approved";
                if (string.Equals(s, "Rejected", StringComparison.OrdinalIgnoreCase)) return "Rejected";
                // Eski alanlardan türetme (bazı kayıtlarda Status boş olabiliyor)
                if (p.IsAllowed == true) return "Approved";
                if (p.IsAllowed == false && !string.IsNullOrWhiteSpace(p.RejectReason)) return "Rejected";
                return string.IsNullOrWhiteSpace(s) ? "Pending" : s;
            }

            var mapped = items
                .Select(p =>
                {
                    var ns = NormStatus(p);
                    var info =
                        ns == "Pending" ? "Onay bekliyor. Talebin değerlendirildiğinde bilgilendirileceksin." :
                        ns == "Approved" ? "Onaylandı. İzin kaydın sistemde işlendi." :
                        ns == "Rejected" ? (string.IsNullOrWhiteSpace(p.RejectReason) ? "Reddedildi." : $"Reddedildi: {p.RejectReason}") :
                        ns;

                    return new MyPermissionRequestItemDto
                    {
                        Id = p.Id,
                        PermissionTypeId = p.PermissionTypeId,
                        PermissionType = p.PermissionType,
                        StartTime = p.StartTime,
                        EndTime = p.EndTime,
                        Description = p.Description,
                        Status = ns,
                        IsAllowed = p.IsAllowed,
                        RejectReason = p.RejectReason,
                        CreatedAt = p.CreatedAt,
                        Info = info
                    };
                })
                .OrderByDescending(x => x.CreatedAt ?? x.StartTime)
                .ToList();

            if (!string.IsNullOrWhiteSpace(status))
            {
                var wanted = status.Trim();
                mapped = mapped
                    .Where(x => string.Equals(x.Status, wanted, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var pendingCount = items.Count(p => string.Equals(NormStatus(p), "Pending", StringComparison.OrdinalIgnoreCase));
            var approvedCount = items.Count(p => string.Equals(NormStatus(p), "Approved", StringComparison.OrdinalIgnoreCase));
            var rejectedCount = items.Count(p => string.Equals(NormStatus(p), "Rejected", StringComparison.OrdinalIgnoreCase));

            return Ok(new MyPermissionRequestsDto
            {
                PendingCount = pendingCount,
                ApprovedCount = approvedCount,
                RejectedCount = rejectedCount,
                TotalCount = items.Count,
                Items = mapped
            });
        }

        [HttpGet("getPermissionById")]
        public IActionResult GetPermissionById(int id)
        {
            var result = _permissionService.GetById(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>Admin: [start, end] aralığıyla kesişen tüm izin kayıtları (takvim görünümü için).</summary>
        [HttpGet("adminCalendar")]
        public IActionResult GetAdminCalendar([FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            var result = _permissionService.GetAdminCalendarEvents(start, end);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }
    }
}