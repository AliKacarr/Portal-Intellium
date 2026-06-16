using Business.BusinessAspects;
using Business.File;
using Business.Repository.NotificationRepository;
using Business.Repository.TicketAttachmentRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TicketAttachmentRepository;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.TicketAttachmentDtos;
using Entities.Enums;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.TicketAttachmentRepository
{
    public class TicketAttachmentManager : ITicketAttachmentService
    {
        private readonly ITicketAttachmentDal _ticketAttachmentDal;
        private readonly IFileService _fileService;
        private readonly ITicketDal _ticketDal;
        private readonly INotificationService _notificationService;
        private readonly IUserContext _userContext;

        public TicketAttachmentManager(ITicketAttachmentDal ticketAttachmentDal, IFileService fileService, ITicketDal ticketDal, INotificationService notificationService, IUserContext userContext)
        {
            _ticketAttachmentDal = ticketAttachmentDal;
            _fileService = fileService;
            _ticketDal = ticketDal;
            _notificationService = notificationService;
            _userContext = userContext;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTicketAttachmentValidator))]
        public async Task<IResult> Add(AddTicketAttachmentDto addTicketAttachmentDto)
        {
            foreach (var ticketAttachment in addTicketAttachmentDto.TicketAttachments)
            {
                if (ticketAttachment.Length > 0)
                {
                    var result = await _fileService.Save(ticketAttachment, FileType.TICKET_ATTACHMENT);
                    if (!result.Success) continue;

                    TicketAttachment newTicketAttachment = new()
                    {
                        TicketId = addTicketAttachmentDto.TicketId,
                        CreatorUserId = _userContext.UserId,
                        Name = result.Data.Name,
                        AttachmentPath = result.Data.FilePath
                    };
                    _ticketAttachmentDal.Add(newTicketAttachment);
                }
            }

            var ticket = _ticketDal.Get(t => t.Id == addTicketAttachmentDto.TicketId);
            AddNotificationDto addNotificationDto = new()
            {
                Title = "Bilet Bildirimi",
                Content = $"{ticket.Name} adlı bilete yeni bir dosya eklendi.",
                Type = NotificationTypes.Ticket.ToString(),
                // EKLENDİ: Ticket ID'sini referans olarak veriyoruz
                ReferenceId = ticket.Id.ToString()
            };
            _notificationService.SendAllByProjecjtId(addNotificationDto, ticket.ProjectId);

            return new SuccessResult("Başarılı");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteTicketAttachmentValidator))]
        public IResult Delete(long ticketAttachmentId)
        {
            var result = _ticketAttachmentDal.Get(t => t.Id.Equals(ticketAttachmentId));

            _ticketAttachmentDal.Delete(result);
            _fileService.Delete(result.AttachmentPath, FileType.TASK_ATTACHMENT);

            return new SuccessResult();
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<TicketAttachment>> GetAllByTicketId(long ticketId)
        {
            var result = _ticketAttachmentDal.GetAll(t => t.TicketId.Equals(ticketId));
            return new SuccessDataResult<List<TicketAttachment>>(result);
        }
    }
}