using Business.BusinessAspects;
using Business.Repository.CommentReplyRepository;
using Business.Repository.NotificationRepository;
using Business.Repository.ProjectTeamMemberRepository;
using Business.Repository.TicketCommentRepository.Constants;
using Business.Repository.TicketCommentRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TicketCommentRepository;
using DataAccess.Repository.TicketRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.TicketCommentDtos;
using Entities.Enums;

namespace Business.Repository.TicketCommentRepository
{
    public class TicketCommentManager : ITicketCommentService
    {
        private readonly ITicketCommentDal _ticketCommentDal;
        private readonly ITicketCommentReplyService _ticketCommentReplyService;
        private readonly ITicketDal _ticketDal;
        private readonly INotificationService _notificationService;
        private readonly IProjectTeamMemberService _projectTeamMemberService;
        private readonly IUserContext _userContext;

        public TicketCommentManager(ITicketCommentDal ticketCommentDal, ITicketCommentReplyService ticketCommentReplyService, ITicketDal ticketDal, INotificationService notificationService, IProjectTeamMemberService projectTeamMemberService, IUserContext userContext)
        {
            _ticketCommentDal = ticketCommentDal;
            _ticketCommentReplyService = ticketCommentReplyService;
            _ticketDal = ticketDal;
            _notificationService = notificationService;
            _projectTeamMemberService = projectTeamMemberService;
            _userContext = userContext;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTicketCommentValidator))]
        public IResult Add(AddTicketCommentDto addTicketComment)
        {
            TicketComment ticketComment = new()
            {
                Content = addTicketComment.Content,
                TicketId = addTicketComment.TicketId,
                UserId = _userContext.UserId,
                CreatedAt = DateTime.Now,
            };
            _ticketCommentDal.Add(ticketComment);

            var ticket = _ticketDal.Get(t => t.Id == addTicketComment.TicketId);
            List<ProjectTeamMember> members = _projectTeamMemberService.GetAllByProject(ticket.ProjectId).Data;
            AddNotificationDto addNotificationDto = new()
            {
                Title = "Yeni Bilet Yorumu",
                Type = NotificationTypes.Ticket.ToString(),
                // EKLENDİ: Ticket ID'sini referans olarak veriyoruz
                ReferenceId = ticket.Id.ToString()
            };

            if (members != null && members.FirstOrDefault(m => m.UserId.Equals(_userContext.UserId)) != null)
            {
                addNotificationDto.AssignedUserId = ticket.CreatorUserId;
                addNotificationDto.Content = $"{ticket.Name} isimli bilete proje ekibinden bir yorum yapıldı.";
                _notificationService.Add(addNotificationDto);
            }
            else
            {
                addNotificationDto.Content = $"{ticket.Name} isimli bilete yeni bir yorum yapıldı.";
                _notificationService.SendAllByProjecjtId(addNotificationDto, ticket.ProjectId);
            }

            return new SuccessResult(TicketCommentMessages.AddedTicketComment);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteTicketCommentValidator))]
        public IResult Delete(long ticketCommentId)
        {
            var ticketComment = _ticketCommentDal.Get(t => t.Id.Equals(ticketCommentId));

            _ticketCommentReplyService.DeleteAllByCommentId(ticketCommentId);

            _ticketCommentDal.Delete(ticketComment);
            return new SuccessResult(TicketCommentMessages.DeletedTicketComment);
        }

        public IResult DeleteAllByTicketId(long ticketId)
        {
            var comments = _ticketCommentDal.GetAll(c => c.TicketId.Equals(ticketId));
            if (!comments.Any()) return new ErrorResult();

            foreach (var comment in comments)
            {
                Delete(comment.Id);
            }
            return new SuccessResult();
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<GetTicketCommentDto>> GetAllByTicketId(long ticketId)
        {
            var comments = _ticketCommentDal.GetAllByTicketId(ticketId);
            return new SuccessDataResult<List<GetTicketCommentDto>>(comments, TicketCommentMessages.TicketCommentListed);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(UpdateTicketCommentValidator))]
        public IResult Update(EditTicketCommentDto editTicketComment)
        {
            var comment = _ticketCommentDal.Get(c => c.Id.Equals(editTicketComment.Id));

            comment.Content = editTicketComment.Content;
            comment.UpdatedAt = DateTime.Now;
            _ticketCommentDal.Update(comment);
            return new SuccessResult(TicketCommentMessages.UpdatedTicketComment);
        }
    }
}