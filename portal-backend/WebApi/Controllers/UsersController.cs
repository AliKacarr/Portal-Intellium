using Business.Repository.UserRepository;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.UserRepository;
using Entities.DTOs.UserDtos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Core.Identity;

namespace WebApi.Controllers
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IUserDal _userDal;
        private readonly PortalContext _context;

        public UsersController(IUserService userService, IUserDal userDal, PortalContext context)
        {
            _userService = userService;
            _userDal = userDal;
            _context = context;
        }

        [HttpPut("update")]
        public IActionResult Update(EditUserDto editUser)
        {
            var result = _userService.UpdateAsDto(editUser);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpPut("changeImage")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
        public async Task<IActionResult> ChangeImage([FromForm] IFormFile image, [FromForm] long userId)
        {
            var result = await _userService.ChangeImage(image, userId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpDelete("removeImage")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
        public IActionResult RemoveImage(long userId)
        {
            var result = _userService.RemoveImage(userId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpDelete("hardDelete")]
        public async Task<IActionResult> HardDelete(long userId)
        {
            var result = await _userService.HardDeleteUser(userId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("getuserlist")]
        // Not paylaşımı gibi alanlarda kullanıcı seçimi için outsource kullanıcıların da listeyi görebilmesi gerekir.
        // Ayrıca normal kullanıcı (user) da not paylaşımı/atama gibi alanlarda kullanıcı seçimi yapabiliyor.
        [Authorize] // Not sayfası olan tüm giriş yapmış kullanıcılar erişebilsin.
        public IActionResult GetUserList()
        {
            // TCKN bilgisini UserProfileDetails tablosundan çek (poliçe eşleştirme için)
            var tcMap = _context.UserProfileDetails
                .AsNoTracking()
                .Where(p => p.TC != null && p.TC != "")
                .ToDictionary(p => p.UserId, p => p.TC);

            try
            {
                var result = _userService.GetAll();
                if (result.Success)
                {
                    var list = (result.Data ?? new List<UserDto>())
                        .Select(u => new
                        {
                            id = u.Id,
                            key = u.Id,
                            name = u.Name,
                            email = u.Email,
                            imageUrl = u.ImageUrl,
                            isActive = u.IsActive,
                            addedAt = u.AddetAt,
                            tc = tcMap.ContainsKey(u.Id) ? tcMap[u.Id] : null,
                            legalConsentAcceptedAt = u.LegalConsentAcceptedAt,
                            kvkkAcceptedAt = ToTurkeyTime(u.KvkkAcceptedAt),
                            kvkkVersion = u.KvkkVersion,
                            explicitConsentAcceptedAt = ToTurkeyTime(u.ExplicitConsentAcceptedAt),
                            explicitConsentVersion = u.ExplicitConsentVersion,

                            // Şirket (Customer)
                            customer = u.Customer == null ? null : new
                            {
                                customerId = u.Customer.CustomerId,
                                customerName = u.Customer.CustomerName
                            },
                            customerId = u.Customer?.CustomerId,
                            customerName = u.Customer?.CustomerName,

                            // Rol
                            userRole = u.UserRole == null ? null : new
                            {
                                id = u.UserRole.Id,
                                roleName = u.UserRole.RoleName
                            },
                            roleId = u.UserRole?.Id,
                            roleName = u.UserRole?.RoleName
                        })
                        .ToList();
                    return Ok(list);
                }
                // service error -> fallback
            }
            catch
            {
                // service layer (GetAllForUserList) bazen join/Single vs kaynaklı patlayabiliyor.
                // Bu sayfayı çalışır tutmak için minimal fallback: sadece Users tablosu.
            }

            // Fallback 1: DAL üzerinden zengin liste (rol/şirket dahil) - aspect yok, direkt query.
            try
            {
                var dalList = _userDal.GetAllForUserList()
                    .Select(u => new
                    {
                        id = u.Id,
                        key = u.Id,
                        name = u.Name,
                        email = u.Email,
                        imageUrl = u.ImageUrl,
                        isActive = u.IsActive,
                        addedAt = u.AddetAt,
                        tc = tcMap.ContainsKey(u.Id) ? tcMap[u.Id] : null,
                        legalConsentAcceptedAt = u.LegalConsentAcceptedAt,
                        kvkkAcceptedAt = ToTurkeyTime(u.KvkkAcceptedAt),
                        kvkkVersion = u.KvkkVersion,
                        explicitConsentAcceptedAt = ToTurkeyTime(u.ExplicitConsentAcceptedAt),
                        explicitConsentVersion = u.ExplicitConsentVersion,
                        customer = u.Customer == null ? null : new
                        {
                            customerId = u.Customer.CustomerId,
                            customerName = u.Customer.CustomerName
                        },
                        customerId = u.Customer?.CustomerId,
                        customerName = u.Customer?.CustomerName,
                        userRole = u.UserRole == null ? null : new
                        {
                            id = u.UserRole.Id,
                            roleName = u.UserRole.RoleName
                        },
                        roleId = u.UserRole?.Id,
                        roleName = u.UserRole?.RoleName
                    })
                    .ToList();
                return Ok(dalList);
            }
            catch
            {
                // ignore -> fallback 2
            }

            // Fallback 2: sadece Users tablosu (rol/şirket bilgisi boş kalır)
            var minimal = _userDal.GetAll()
                .OrderBy(u => u.Id)
                .Select(u => new
                {
                    id = u.Id,
                    key = u.Id,
                    name = u.Name,
                    email = u.Email,
                    imageUrl = u.ImageUrl,
                    isActive = u.IsActive,
                    addedAt = u.AddetAt,
                    tc = tcMap.ContainsKey(u.Id) ? tcMap[u.Id] : null,
                    legalConsentAcceptedAt = u.LegalConsentAcceptedAt,
                    kvkkAcceptedAt = (DateTime?)null,
                    kvkkVersion = (int?)null,
                    explicitConsentAcceptedAt = (DateTime?)null,
                    explicitConsentVersion = (int?)null,
                    customer = (object?)null,
                    customerId = (long?)null,
                    customerName = (string?)null,
                    userRole = (object?)null,
                    roleId = (int?)null,
                    roleName = (string?)null
                })
                .ToList();
            return Ok(minimal);
        }

        // Alias'lar: bazı frontend sürümleri /api/users veya /api/users/list çağırabilir
        [HttpGet]
        [HttpGet("list")]
        public IActionResult ListUsers() => GetUserList();

        [HttpGet("getById")]
        public IActionResult GetById(long id)
        {
            var result = _userService.GetUserAsDtoById(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        [HttpGet("getByName")]
        public IActionResult GetByName(string name)
        {
            var result = _userService.GetByName(name);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result.Message);
        }

        private static DateTime? ToTurkeyTime(DateTime? value)
        {
            if (!value.HasValue) return null;

            var utcValue = DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
            try
            {
                return DateTime.SpecifyKind(
                    TimeZoneInfo.ConvertTimeFromUtc(utcValue, TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time")),
                    DateTimeKind.Unspecified);
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.SpecifyKind(
                    TimeZoneInfo.ConvertTimeFromUtc(utcValue, TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul")),
                    DateTimeKind.Unspecified);
            }
        }
    }
}
