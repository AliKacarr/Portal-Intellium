using System;
using System.Collections.Generic;
using Business.Repository.NotificationRepository;
using Entities.DTOs.NotificationDtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class NotificationsController : ControllerBase
	{
		private readonly INotificationService _notificationService;
		private readonly ILogger<NotificationsController> _logger;

		public NotificationsController(INotificationService notificationService, ILogger<NotificationsController> logger)
		{
			_notificationService = notificationService;
			_logger = logger;
		}

		/// <summary>Sayfalı bildirim listesi. Query: pageNumber=1, pageSize=10 (varsayılan). userId token'dan alınır.</summary>
		[HttpGet("getnotifications")]
		public async Task<IActionResult> GetAll([FromQuery(Name = "pageNumber")] int pageNumber = 1, [FromQuery(Name = "pageSize")] int pageSize = 10)
		{
			if (pageNumber < 1) pageNumber = 1;
			if (pageSize < 1 || pageSize > 100) pageSize = 10;
			try
			{
				var result = await _notificationService.GetAllPaginated(pageNumber, pageSize);
				if (result.Success)
					return Ok(result);
				return BadRequest(result.Message ?? "Bildirimler alınamadı.");
			}
			catch (UnauthorizedAccessException ex)
			{
				_logger.LogWarning(ex, "Bildirim listesi reddedildi (rol). pageNumber={PageNumber}, pageSize={PageSize}", pageNumber, pageSize);
				return StatusCode(403, new { success = false, message = ex.Message });
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Bildirimler alınırken hata oluştu. UserId token'dan okunur. pageNumber={PageNumber}, pageSize={PageSize}", pageNumber, pageSize);
				return Ok(new
				{
					success = true,
					data = new List<GetNotificationDto>(),
					totalCount = 0,
					pageNumber,
					pageSize
				});
			}
		}

		[HttpDelete("delete")]
		public IActionResult Delete(long notificationId)
		{
			var result = _notificationService.Delete(notificationId);
			return result.Success ? Ok(result) : BadRequest(result);
		}

		/// <summary>Tek bildirim sil (yalnızca token kullanıcısına atanmış kayıt). Frontend: deleteNotification.</summary>
		[HttpDelete("deletenotification")]
		public IActionResult DeleteNotification([FromQuery(Name = "notificationId")] long notificationId)
		{
			var result = _notificationService.Delete(notificationId);
			return result.Success ? NoContent() : BadRequest(result);
		}

		/// <summary>Oturumdaki kullanıcıya ait tüm bildirimleri siler. Frontend: deleteAllNotifications.</summary>
		[HttpDelete("deleteall")]
		public async Task<IActionResult> DeleteAllNotifications()
		{
			var result = await _notificationService.DeleteAllForCurrentUserAsync();
			return result.Success ? NoContent() : BadRequest(result);
		}

		[HttpPatch("markasread")]
		public IActionResult MarkAsRead(long notificationId)
		{
			var result = _notificationService.MarkAsRead(notificationId);
			return result.Success ? Ok(result) : BadRequest(result);
		}

		[HttpPost("sendallusers")]
		public IActionResult SendAllUsers([FromBody] AddNotificationDto addNotificationDto)
		{
			var result = _notificationService.SendAllUsers(addNotificationDto);
			return result.Success ? Ok(result) : BadRequest(result);
		}

		[HttpPost("sendallbyroleid")]
		public IActionResult SendAllByRoleId([FromBody] AddNotificationDto addNotificationDto, long id)
		{
			var result = _notificationService.SendAllByRoleId(addNotificationDto, id);
			return result.Success ? Ok(result) : BadRequest(result);
		}
	}
}
