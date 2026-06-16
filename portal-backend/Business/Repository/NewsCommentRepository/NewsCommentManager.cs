using Business.BusinessAspects;
using Business.Repository.NewsCommentRepository.Validations;
using Business.Repository.NotificationRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.NewsCommentRepository;
using DataAccess.Repository.NewsRepository;
using Entities.Concrete;
using Entities.Constants;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.NewsCommentDtos;
using System.Text.Json;

namespace Business.Repository.NewsCommentRepository
{
    public class NewsCommentManager : INewsCommentService
    {
        private readonly INewsCommentDal _newsCommentDal;
        private readonly INewsDal _newsDal;
        private readonly IUserContext _userContext;
        private readonly INotificationService _notificationService;

        public NewsCommentManager(
            INewsCommentDal newsCommentDal,
            INewsDal newsDal,
            IUserContext userContext,
            INotificationService notificationService)
        {
            _newsCommentDal = newsCommentDal;
            _newsDal = newsDal;
            _userContext = userContext;
            _notificationService = notificationService;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User}")]
        public IDataResult<List<GetNewsCommentDto>> GetByNewsId(long newsId)
        {
            return new SuccessDataResult<List<GetNewsCommentDto>>(_newsCommentDal.GetCommentsByNewsId(newsId));
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User}")]
        [ValidationAspect(typeof(AddNewsCommentDtoValidator))]
        public IResult Add(AddNewsCommentDto dto)
        {
            var news = _newsDal.Get(n => n.Id == dto.NewsId && n.IsActive);
            if (news == null)
                return new ErrorResult("Haber bulunamadı.");
            if (!news.IsCommentable)
                return new ErrorResult("Bu habere yorum yapılamaz.");

            NewsComment? parentComment = null;
            if (dto.ParentCommentId.HasValue)
            {
                parentComment = _newsCommentDal.Get(c => c.Id == dto.ParentCommentId.Value && c.IsActive);
                if (parentComment == null)
                    return new ErrorResult("Yanıtlanmak istenen yorum bulunamadı.");
            }

            var comment = new NewsComment
            {
                Content = dto.Content,
                NewsId = dto.NewsId,
                UserId = _userContext.UserId,
                ParentCommentId = dto.ParentCommentId,
                IsActive = true,
                CreatedAt = DateTime.Now
            };
            _newsCommentDal.Add(comment);

            try
            {
                var navJson = JsonSerializer.Serialize(new { commentId = comment.Id });
                var notified = new HashSet<long>();

                void TryNotify(long userId, string title, string content)
                {
                    if (userId == _userContext.UserId || !notified.Add(userId))
                        return;
                    _notificationService.Add(new AddNotificationDto
                    {
                        AssignedUserId = userId,
                        Title = title,
                        Content = content,
                        Type = NotificationTypeKeys.NewsComment,
                        ReferenceId = dto.NewsId.ToString(),
                        NavigationData = navJson
                    });
                }

                TryNotify(
                    news.CreatedById,
                    "Haberinize yorum yapıldı",
                    $"'{news.Title}' haberine yeni yorum.");

                if (parentComment != null)
                    TryNotify(
                        parentComment.UserId,
                        "Yorumunuza yanıt verildi",
                        $"'{news.Title}' haberinde yanıt aldınız.");
            }
            catch { /* Bildirim hatası yorumu engellemesin */ }

            return new SuccessResult("Yorum eklendi.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User}")]
        public IResult Delete(long id)
        {
            var comment = _newsCommentDal.Get(c => c.Id == id && c.IsActive);
            if (comment == null)
                return new ErrorResult("Yorum bulunamadı.");

            // Sadece kendi yorumunu veya admin silebilir
            if (comment.UserId != _userContext.UserId && _userContext.RoleName != RoleNames.Admin)
                return new ErrorResult("Bu yorumu silme yetkiniz yok.");

            comment.IsActive = false;
            _newsCommentDal.Update(comment);
            return new SuccessResult("Yorum silindi.");
        }
    }
}
