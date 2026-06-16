using Business.BusinessAspects;
using Business.Repository.CommentReplyRepository.Constants;
using Business.Repository.TicketCommentReplyRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.CommentReplyRepository;
using Entities.Concrete;
using Entities.DTOs.TicketCommentReplyDtos;

namespace Business.Repository.CommentReplyRepository
{
	public class TicketCommentReplyManager : ITicketCommentReplyService
	{
		private readonly ITicketCommentReplyDal _ticketCommentReplyDal;
		private readonly IUserContext _userContext;

		public TicketCommentReplyManager(ITicketCommentReplyDal ticketCommentReplyDal, IUserContext userContext)
		{
			_ticketCommentReplyDal = ticketCommentReplyDal;
			_userContext = userContext;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(AddTicketCommentReplyValidator))]
		public IResult Add(AddTicketCommentReplyDto addTicketCommentReply)
		{
			TicketCommentReply commentReply = new()
			{
				Content = addTicketCommentReply.Content,
				TicketCommentId = addTicketCommentReply.TicketCommentId,
				UserId = _userContext.UserId,
				CreatedAt = DateTime.Now
			};
			_ticketCommentReplyDal.Add(commentReply);
			return new SuccessResult(TicketCommentReplyMessages.AddedCommentReply);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(DeleteTicketCommentReplyValidator))]
		public IResult Delete(long commentReplyId)
		{
			var reply = _ticketCommentReplyDal.Get(r => r.Id.Equals(commentReplyId));
			_ticketCommentReplyDal.Delete(reply);
			return new SuccessResult(TicketCommentReplyMessages.DeletedCommentReply);
		}

		public IResult DeleteAllByCommentId(long commentId)
		{
			var replies = _ticketCommentReplyDal.GetAll(r => r.TicketCommentId.Equals(commentId));
			if (!replies.Any()) return new ErrorResult();

			foreach (var reply in replies)
			{
				_ticketCommentReplyDal.Delete(reply);
			}
			return new SuccessResult();

		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateTicketCommentReplyValidator))]
		public IResult Update(EditTicketCommentReplyDto editTicketCommentReply)
		{
			var reply = _ticketCommentReplyDal.Get(r => r.Id.Equals(editTicketCommentReply.Id));
			reply.Content = editTicketCommentReply.Content;
			reply.UpdatedAt = DateTime.Now;
			_ticketCommentReplyDal.Update(reply);
			return new SuccessResult(TicketCommentReplyMessages.UpdatedCommentReply);
		}
	}
}
