using Core.Identity;
using Core.Utilities.Exceptions;
using DataAccess.Repository.TicketAttachmentRepository;
using Entities.Concrete;
using FluentValidation;

namespace Business.Repository.TicketAttachmentRepository.Validations
{
    public class DeleteTicketAttachmentValidator : AbstractValidator<long>
    {
        private readonly ITicketAttachmentDal _ticketAttachmentDal;
        private readonly IUserContext _userContext;
        private TicketAttachment? _cachedTicketAttachment;
        public DeleteTicketAttachmentValidator(ITicketAttachmentDal ticketAttachmentDal, IUserContext userContext)
        {
            _ticketAttachmentDal = ticketAttachmentDal;
            _userContext = userContext;

            RuleFor(attachmentId => attachmentId)
                .Must(AttachmentExists).WithMessage("Silinecek ek bulunamadı")
                .Must(UserHasPermission);


        }
        private bool AttachmentExists(long id)
        {
			_cachedTicketAttachment = _ticketAttachmentDal.Get(t => t.Id == id);
            return _cachedTicketAttachment != null;
        }
        private bool UserHasPermission(long id)
        {
            var attachment = _cachedTicketAttachment ?? _ticketAttachmentDal.Get(t => t.Id == id);
            if (attachment == null) return false;

            if (attachment.CreatorUserId == _userContext.UserId || _userContext.RoleName == RoleNames.Admin)
                return true;

            throw new ForbiddenAccessException();
        }
    }
}
