using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.NotificationRepository; // ✅ EKLENDİ
using Business.Repository.TicketEffortRepository.Constants;
using Business.Repository.TicketEffortRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TicketEffortRepository;
using DataAccess.Repository.TicketRepository; // ✅ EKLENDİ (Bilet ismini çekmek için)
using Entities.Concrete;
using Entities.DTOs.NotificationDtos; // ✅ EKLENDİ
using Entities.DTOs.TicketEffortDtos;
using Entities.Enums; // ✅ NotificationTypes için

namespace Business.Repository.TicketEffortRepository
{
    public class TicketEffortManager : ITicketEffortService
    {
        private readonly ITicketEffortDal _ticketEffortDal;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        
        // 🔥 Yeni Eklenen Bağımlılıklar
        private readonly INotificationService _notificationService;
        private readonly ITicketDal _ticketDal;

        public TicketEffortManager(ITicketEffortDal ticketEffortDal, IMapper mapper, IUserContext userContext, INotificationService notificationService, ITicketDal ticketDal)
        {
            _ticketEffortDal = ticketEffortDal;
            _mapper = mapper;
            _userContext = userContext;
            _notificationService = notificationService;
            _ticketDal = ticketDal;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTicketEffortValidator))]
        public IDataResult<GetTicketEffortDto> Add(AddTicketEffortDto addTicketEffort)
        {
            var ticketEffort = _mapper.Map<TicketEffort>(addTicketEffort);
            ticketEffort.CreatedByUserId = _userContext.UserId;
            _ticketEffortDal.Add(ticketEffort);

            // --- 🔥 BİLDİRİM: YENİ EFOR GİRİŞİ 🔥 ---
            try 
            {
                var ticket = _ticketDal.Get(t => t.Id == addTicketEffort.TicketId);
                if (ticket != null)
                {
                    AddNotificationDto addNotificationDto = new()
                    {
                        Title = "Yeni Efor Girişi",
                        Content = $"{ticket.Name} biletine yeni bir efor/çalışma süresi girildi.",
                        Type = NotificationTypes.Ticket.ToString(),
                        ReferenceId = ticket.Id.ToString() // Tıklayınca bilete gider
                    };
                    
                    // Projedeki herkese haber ver
                    _notificationService.SendAllByProjecjtId(addNotificationDto, ticket.ProjectId);
                }
            }
            catch { /* Bildirim hatası efor kaydını bozmasın */ }
            // ----------------------------------------

            return new SuccessDataResult<GetTicketEffortDto>(
                _mapper.Map<GetTicketEffortDto>(ticketEffort),
                TicketEffortMessages.EffortAddedSuccessfully);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteTicketEffortValidator))]
        public IResult Delete(long ticketEffortId)
        {
            var ticketEffort = _ticketEffortDal.Get(te => te.Id.Equals(ticketEffortId));
            if (ticketEffort != null)
            {
                _ticketEffortDal.Delete(ticketEffort);
            }

            return new SuccessResult(TicketEffortMessages.EffortDeletedSuccessfully);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<GetTicketEffortDto>> GetAllByTicketId(long ticketId)
        {
            var ticketEfforts = _ticketEffortDal.GetAll(te => te.TicketId.Equals(ticketId));
            return new SuccessDataResult<List<GetTicketEffortDto>>(_mapper.Map<List<GetTicketEffortDto>>(ticketEfforts));
        }
    }
}