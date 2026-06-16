using AutoMapper;
using Business.BusinessAspects;
using Business.MessageBrokers.MassTransit.RabbitMQ.Publishers;
using Business.Repository.NotificationRepository;
using Business.Repository.ProjectRepository;
using Business.Repository.TicketAttachmentRepository;
using Business.Repository.TicketRepository.Constants;
using Business.Repository.TicketRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskListRepository;
using DataAccess.Repository.TaskRepository;
using DataAccess.Repository.TicketAttachmentRepository;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.TicketAttachmentDtos;
using Entities.DTOs.TicketDtos;
using Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.TicketRepository
{
    public class TicketManager : ITicketService
    {
        private readonly ITicketDal _ticketDal;
        private readonly ITicketAttachmentService _ticketAttachmentService;
        private readonly INotificationService _notificationService;
        private readonly IProjectService _projectService;
        private readonly TicketTagPublisher _ticketTagPublisher;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly IBoardDal _boardDal;
        private readonly ITaskListDal _taskListDal;
        private readonly ITaskDal _taskDal;
        private readonly ITaskMemberDal _taskMemberDal;
        private readonly ITaskAttachmentDal _taskAttachmentDal;
        private readonly ITicketAttachmentDal _ticketAttachmentDal;

        public TicketManager(
            ITicketDal ticketDal,
            ITicketAttachmentService ticketAttachmentService,
            INotificationService notificationService,
            IProjectService projectService,
            TicketTagPublisher ticketTagPublisher,
            IMapper mapper,
            IUserContext userContext,
            IBoardDal boardDal,
            ITaskListDal taskListDal,
            ITaskDal taskDal,
            ITaskMemberDal taskMemberDal,
            ITaskAttachmentDal taskAttachmentDal,
            ITicketAttachmentDal ticketAttachmentDal)
        {
            _ticketDal = ticketDal;
            _ticketAttachmentService = ticketAttachmentService;
            _notificationService = notificationService;
            _projectService = projectService;
            _ticketTagPublisher = ticketTagPublisher;
            _mapper = mapper;
            _userContext = userContext;
            _boardDal = boardDal;
            _taskListDal = taskListDal;
            _taskDal = taskDal;
            _taskMemberDal = taskMemberDal;
            _taskAttachmentDal = taskAttachmentDal;
            _ticketAttachmentDal = ticketAttachmentDal;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTicketValidator))]
        public async Task<IResult> Add(AddTicketDto addTicket, List<IFormFile>? attachments)
        {
            Ticket ticket = new()
            {
                Name = addTicket.Name,
                Description = addTicket.Description,
                ProjectId = addTicket.ProjectId,
                CustomerId = _userContext.CustomerId,
                CreatorUserId = _userContext.UserId,
                CreationDate = DateTime.Now,
                Status = TicketStatus.New_Request
            };
            _ticketDal.Add(ticket);

            if (!attachments.IsNullOrEmpty())
            {
                await _ticketAttachmentService.Add(new AddTicketAttachmentDto { TicketAttachments = attachments!, TicketId = ticket.Id });
            }

            var projectResult = _projectService.GetById(addTicket.ProjectId);
            AddNotificationDto addNotificationDto = new()
            {
                AssignedUserId = ticket.CreatorUserId,
                Content = $"{projectResult.Data.ProjectName} isimli projeye ait yeni bilet oluşturulmuştur.",
                Title = "Yeni Bilet",
                Type = NotificationTypes.Ticket.ToString(),
                // EKLENDİ: Ticket ID referansı
                ReferenceId = ticket.Id.ToString()
            };

            _notificationService.Add(addNotificationDto);

            addNotificationDto.Content = $"{projectResult.Data.ProjectName} projesine ait yeni bir bilet oluşturuldu";
            _notificationService.SendAllByProjecjtId(addNotificationDto, projectResult.Data.Id);

            await _ticketTagPublisher.Publish(_mapper.Map<PublishTicketDto>(ticket));

            return new SuccessResult(TicketMessages.AddedTicket);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(UpdateTicketValidator))]
        public IResult Update(EditTicketDto ticket)
        {
            var updatedTicket = _ticketDal.Get(t => t.Id.Equals(ticket.Id));
            updatedTicket.RequestType = ticket.RequestType;
            updatedTicket.Status = ticket.Status;

            if (ticket.Status == TicketStatus.New_Request)
            {
                updatedTicket.AssignedUserId = null;
                updatedTicket.AssignedDate = null;
            }

            if (ticket.AssignedUserId != null && updatedTicket.AssignedUserId != ticket.AssignedUserId)
            {
                updatedTicket.AssignedDate = DateTime.Now;
                updatedTicket.AssignedUserId = ticket.AssignedUserId;
                CreateScrumTasksForTicket(
                    updatedTicket,
                    ticket.AssignedUserId.Value,
                    ticket.TargetBoardId,
                    ticket.TargetTaskListId);
            }

            if (ticket.Status == TicketStatus.Resolved)
            {
                updatedTicket.ResolutionDate = DateTime.Now;
            }

            _ticketDal.Update(updatedTicket);

            AddNotificationDto addNotificationDto = new()
            {
                Title = "Bilet Güncellendi",
                Content = $"{updatedTicket.Name} biletinin detaylarında düzenleme yapıldı!",
                Type = NotificationTypes.Ticket.ToString(),
                // EKLENDİ: Ticket ID referansı
                ReferenceId = updatedTicket.Id.ToString()
            };
            _notificationService.SendAllByProjecjtId(addNotificationDto, updatedTicket.ProjectId);

            return new SuccessResult(TicketMessages.UpdatedTicket);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(GetByIdTicketValidator))]
        public IDataResult<GetTicketDto> GetById(long id)
        {
            var ticket = _ticketDal.GetById(id);
            return new SuccessDataResult<GetTicketDto>(ticket, TicketMessages.TicketListed);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<GetTicketDto>> GetAll()
        {
            List<GetTicketDto> tickets = _userContext.RoleName.Equals(RoleNames.User) ?
                _ticketDal.GetAllByCustomerAndUser(_userContext.CustomerId, _userContext.UserId)
                : _ticketDal.GetAllAsDto();
            return new SuccessDataResult<List<GetTicketDto>>(tickets, TicketMessages.TicketListed);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public async Task<IResult> GetPaginatedTickets(int pageNumber, int pageSize)
        {
            IResult tickets = _userContext.RoleName.Equals(RoleNames.User) ?
                await _ticketDal.GetPaginatedByCustomerAndUserAsync(_userContext.CustomerId, _userContext.UserId, pageNumber, pageSize)
                : await _ticketDal.GetPaginatedAsync(pageNumber, pageSize);
            return tickets;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<GetTicketDto>> GetLastTickets(int ticketCount)
        {
            List<GetTicketDto> tickets = _userContext.RoleName.Equals(RoleNames.User) ?
                _ticketDal.GetLastTicketsByCustomerAndUser(_userContext.CustomerId, _userContext.UserId, ticketCount)
                : _ticketDal.GetLastTickets(ticketCount);
            return new SuccessDataResult<List<GetTicketDto>>(tickets, TicketMessages.TicketListed);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<TicketCountDto> GetTicketCount()
        {
            TicketCountDto count = _userContext.RoleName.Equals(RoleNames.User) ?
                _ticketDal.GetTicketCountByCustomerAndUser(_userContext.CustomerId, _userContext.UserId)
                : _ticketDal.GetTicketCount();
            return new SuccessDataResult<TicketCountDto>(count);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AssignUserToTicketValidator))]
        public IResult AssignUser(AssignUserToTicketDto assignUserToTicket)
        {
            var ticket = _ticketDal.Get(ticket => ticket.Id.Equals(assignUserToTicket.Id));

            ticket.Status = TicketStatus.Assigned;
            ticket.AssignedUserId = assignUserToTicket.AssignedUserId;
            ticket.AssignedDate = DateTime.Now;
            _ticketDal.Update(ticket);
            CreateScrumTasksForTicket(
                ticket,
                assignUserToTicket.AssignedUserId,
                assignUserToTicket.TargetBoardId,
                assignUserToTicket.TargetTaskListId);
            return new SuccessResult(TicketMessages.TicketAssignedToUser);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(MarkAsResolvedTicketValidator))]
        public IResult MarkAsResolved(long id)
        {
            var ticket = _ticketDal.Get(ticket => ticket.Id.Equals(id));

            ticket.Status = TicketStatus.Resolved;
            ticket.ResolutionDate = DateTime.Now;

            _ticketDal.Update(ticket);
            return new SuccessResult(TicketMessages.TicketResolved);
        }

        private void CreateScrumTasksForTicket(
            Ticket ticket,
            long assignedUserId,
            int? targetBoardId = null,
            int? targetTaskListId = null)
        {
            if (assignedUserId <= 0 || assignedUserId > int.MaxValue)
            {
                return;
            }

            List<Board> boards;
            if (targetBoardId.HasValue)
            {
                var selectedBoard = _boardDal.Get(b => b.Id == targetBoardId.Value && b.ProjectId == ticket.ProjectId);
                if (selectedBoard == null)
                {
                    return;
                }
                boards = new List<Board> { selectedBoard };
            }
            else
            {
                boards = _boardDal.GetAll(b => b.ProjectId == ticket.ProjectId);
            }

            if (boards.IsNullOrEmpty())
            {
                return;
            }

            var ticketAttachments = _ticketAttachmentDal.GetAll(a => a.TicketId == ticket.Id);

            foreach (var board in boards)
            {
                TaskList? ticketTaskList = null;
                if (targetTaskListId.HasValue)
                {
                    ticketTaskList = _taskListDal.Get(tl => tl.Id == targetTaskListId.Value && tl.BoardId == board.Id);
                }

                ticketTaskList ??= _taskListDal.Get(tl => tl.BoardId == board.Id && tl.Name == "Biletler");
                if (ticketTaskList == null)
                {
                    var maxTaskListOrder = _taskListDal.GetAll(tl => tl.BoardId == board.Id)
                        .OrderByDescending(tl => tl.OrderNo)
                        .FirstOrDefault()
                        ?.OrderNo ?? 0;

                    ticketTaskList = new TaskList
                    {
                        BoardId = board.Id,
                        Name = "Biletler",
                        OrderNo = maxTaskListOrder + 1
                    };
                    _taskListDal.Add(ticketTaskList);
                }

                var maxTaskOrder = _taskDal.GetAll(t => t.TaskListId == ticketTaskList.Id)
                    .OrderByDescending(t => t.OrderNo)
                    .FirstOrDefault()
                    ?.OrderNo ?? 0;

                var newTask = new Entities.Concrete.Task
                {
                    TaskListId = ticketTaskList.Id,
                    Name = $"{ticket.Id} - {ticket.Name}",
                    Description = ticket.Description ?? string.Empty,
                    OrderNo = maxTaskOrder + 1,
                    CreatedDate = DateTime.Now,
                    DueDate = DateTime.Today
                };
                _taskDal.Add(newTask);

                _taskMemberDal.Add(new TaskMember
                {
                    TaskId = newTask.Id,
                    UserId = (int)assignedUserId
                });

                foreach (var attachment in ticketAttachments)
                {
                    _taskAttachmentDal.Add(new TaskAttachment
                    {
                        TaskId = newTask.Id,
                        CreatorUserId = attachment.CreatorUserId,
                        Name = attachment.Name,
                        AttachmentPath = attachment.AttachmentPath
                    });
                }
            }
        }
    }
}