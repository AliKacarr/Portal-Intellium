using Business.Helpers;
using Business.Repository.PermissionRepository;
using Business.Repository.UserPermissionRepository;
using Business.Repository.UserRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Quartz;
using Business.Schedulers.Keys;

namespace WebApi.Controllers
{
    [Route("api/userPermission")]
    [ApiController]
    public class UserPermissionController : ControllerBase
    {
        private readonly IUserPermissionService _userPermissionService;
        private readonly IUserDal _userDal;
        private readonly ISchedulerFactory _schedulerFactory;

        public UserPermissionController(
            IUserPermissionService userPermissionService,
            IUserDal userDal,
            ISchedulerFactory schedulerFactory)
        {
            _userPermissionService = userPermissionService;
            _userDal = userDal;
            _schedulerFactory = schedulerFactory;
        }

        [HttpPost("add")]
        public IActionResult Add(UserPermission userPermission)
        {
            var result = _userPermissionService.Add(userPermission);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _userPermissionService.GetAll();
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpPut("updateuserpermission")]
        public IActionResult UpdateUserPermissionById(UserPermission userPermission)
        {
            var result = _userPermissionService.Update(userPermission);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        // --- GÜNCELLENEN KISIM ---
        [HttpGet("getUserPermissionById")]
        public IActionResult GetUserPermissionById(int id)
        {
            // Manager katmanında düzelttiğimiz metodu çağırıyoruz.
            // Artık veritabanında UserId'ye göre arama yapacak.
            var result = _userPermissionService.GetUserPermissionById(id);

            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("getLeaveEntitlementExplanation")]
        public IActionResult GetLeaveEntitlementExplanation(int id)
        {
            var result = _userPermissionService.GetLeaveEntitlementExplanation(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        // ADMİN MANUEL BAKİYE GÜNCELLEMESİ
        // RecalculateFromJobAndProfile çağırmaz → Admin'in girdiği değer direkt kaydedilir.
        [HttpPut("adminUpdateBalance")]
        public IActionResult AdminUpdateBalance([FromBody] UserPermission userPermission)
        {
            var result = _userPermissionService.AdminUpdateLeaveBalance(userPermission);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("userPermissionExportToExcel")]
        public IActionResult UserPermissionExportToExcel()
        {
            try
            {
                // UserPermissionExportToExcel sınıfını kullanarak Excel'e veri aktarımını gerçekleştir
                var excelExporter = new UserPermissionExportToExcel(_userPermissionService, _userDal);
                excelExporter.ExportToExcel();

                return Ok("Excel dosyası başarıyla oluşturuldu.");
            }
            catch (Exception ex)
            {
                // Hata durumunda uygun bir HTTP durumuyla geri dön
                return BadRequest($"Hata oluştu: {ex.Message}");
            }
        }
    }
}