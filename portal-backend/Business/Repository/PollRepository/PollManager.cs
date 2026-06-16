using Business.BusinessAspects;
using Business.Helpers;
using Business.Repository.NotificationRepository;
using Business.Repository.PollRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.PollOptionRepository;
using DataAccess.Repository.PollQuestionRepository;
using DataAccess.Repository.PollRepository;
using DataAccess.Repository.PollVoteRepository;
using DataAccess.Repository.UserJobDetailRepository;
using Entities.Concrete;
using Entities.Constants;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.PollDtos;

namespace Business.Repository.PollRepository
{
    public class PollManager : IPollService
    {
        private readonly IPollDal _pollDal;
        private readonly IPollQuestionDal _pollQuestionDal;
        private readonly IPollOptionDal _pollOptionDal;
        private readonly IPollVoteDal _pollVoteDal;
        private readonly IUserContext _userContext;
        private readonly INotificationService _notificationService;
        private readonly IUserJobDetailDal _userJobDetailDal;

        public PollManager(
            IPollDal pollDal,
            IPollQuestionDal pollQuestionDal,
            IPollOptionDal pollOptionDal,
            IPollVoteDal pollVoteDal,
            IUserContext userContext,
            INotificationService notificationService,
            IUserJobDetailDal userJobDetailDal)
        {
            _pollDal = pollDal;
            _pollQuestionDal = pollQuestionDal;
            _pollOptionDal = pollOptionDal;
            _pollVoteDal = pollVoteDal;
            _userContext = userContext;
            _notificationService = notificationService;
            _userJobDetailDal = userJobDetailDal;
        }

        private static bool IsAdmin(string? roleName) =>
            string.Equals((roleName ?? string.Empty).Trim(), RoleNames.Admin, StringComparison.OrdinalIgnoreCase);

        private bool PortalUserCanSeePoll(GetPollDto dto) =>
            PortalBolumAccess.UserCanSeePoll(
                _userContext.UserId,
                dto.IsGeneral,
                dto.DepartmentId,
                dto.DepartmentName);

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<List<PollListDto>> GetAll()
        {
            if (IsAdmin(_userContext.RoleName))
                return new SuccessDataResult<List<PollListDto>>(_pollDal.GetAllAsDto(_userContext.UserId));

            return new SuccessDataResult<List<PollListDto>>(_pollDal.GetAllAsDtoForPortalUser(_userContext.UserId));
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<List<PollListDto>> GetActive()
        {
            if (IsAdmin(_userContext.RoleName))
                return new SuccessDataResult<List<PollListDto>>(_pollDal.GetActivePolls(_userContext.UserId));

            var list = _pollDal.GetActivePollsForPortalUser(_userContext.UserId);
            return new SuccessDataResult<List<PollListDto>>(list);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.PortalReaders)]
        public IDataResult<GetPollDto> GetById(long id)
        {
            var dto = _pollDal.GetByIdAsDto(id, _userContext.UserId);
            if (dto == null)
                return new ErrorDataResult<GetPollDto>("Anket bulunamadı.");

            if (!IsAdmin(_userContext.RoleName) && !PortalUserCanSeePoll(dto))
                return new ErrorDataResult<GetPollDto>("Anket bulunamadı.");

            return new SuccessDataResult<GetPollDto>(dto);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        [ValidationAspect(typeof(AddPollDtoValidator))]
        public IResult Add(AddPollDto dto)
        {
            var departmentId = dto.DepartmentId is > 0 ? dto.DepartmentId : null;
            var poll = new Poll
            {
                Title = dto.Title,
                Content = dto.Content,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsGeneral = dto.IsGeneral && !departmentId.HasValue,
                DepartmentId = departmentId,
                CreatedById = _userContext.UserId,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now
            };
            _pollDal.Add(poll);

            for (int i = 0; i < dto.Questions.Count; i++)
            {
                var qDto = dto.Questions[i];
                var question = new PollQuestion
                {
                    Text = qDto.Text.Trim(),
                    PollId = poll.Id,
                    OrderIndex = i,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };
                _pollQuestionDal.Add(question);

                foreach (var optionText in qDto.Options.Where(o => !string.IsNullOrWhiteSpace(o)))
                {
                    _pollOptionDal.Add(new PollOption
                    {
                        Text = optionText.Trim(),
                        PollQuestionId = question.Id,
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    });
                }
            }

            try
            {
                if (dto.StartDate <= DateTime.Now)
                {
                    var notifTemplate = new AddNotificationDto
                    {
                        AssignedUserId = 0,
                        Title = "Yeni Anket",
                        Content = $"'{dto.Title}' anketi yayınlandı.",
                        Type = NotificationTypeKeys.Poll,
                        ReferenceId = poll.Id.ToString()
                    };

                    if (poll.IsGeneral || !poll.DepartmentId.HasValue)
                        _notificationService.BroadcastToAllActiveUsers(notifTemplate);
                    else
                        _notificationService.BroadcastToDepartment(poll.DepartmentId.Value, notifTemplate);
                }
            }
            catch { /* Bildirim hatası anketi engellemesin */ }

            return new SuccessResult("Anket oluşturuldu.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker}")]
        public IResult Update(UpdatePollDto dto)
        {
            var poll = _pollDal.Get(p => p.Id == dto.Id);
            if (poll == null)
                return new ErrorResult("Anket bulunamadı.");

            poll.Title = dto.Title;
            poll.Content = dto.Content;
            poll.StartDate = dto.StartDate;
            poll.EndDate = dto.EndDate;
            var departmentId = dto.DepartmentId is > 0 ? dto.DepartmentId : null;
            poll.IsGeneral = dto.IsGeneral && !departmentId.HasValue;
            poll.IsActive = dto.IsActive;
            poll.DepartmentId = departmentId;
            _pollDal.Update(poll);

            var validQuestions = dto.Questions
                ?.Where(q => !string.IsNullOrWhiteSpace(q.Text))
                .ToList() ?? new List<AddPollQuestionDto>();

            if (validQuestions.Count >= 1)
            {
                var existingVotes = _pollVoteDal.GetAll(v => v.PollId == dto.Id);
                foreach (var vote in existingVotes)
                    _pollVoteDal.Delete(vote);

                poll.TotalParticipants = 0;
                _pollDal.Update(poll);

                var existingQuestions = _pollQuestionDal.GetAll(q => q.PollId == dto.Id);
                foreach (var q in existingQuestions)
                {
                    var existingOpts = _pollOptionDal.GetAll(o => o.PollQuestionId == q.Id);
                    foreach (var opt in existingOpts)
                        _pollOptionDal.Delete(opt);
                    _pollQuestionDal.Delete(q);
                }

                for (int i = 0; i < validQuestions.Count; i++)
                {
                    var qDto = validQuestions[i];
                    var question = new PollQuestion
                    {
                        Text = qDto.Text.Trim(),
                        PollId = poll.Id,
                        OrderIndex = i,
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    };
                    _pollQuestionDal.Add(question);

                    foreach (var optionText in qDto.Options.Where(o => !string.IsNullOrWhiteSpace(o)))
                    {
                        _pollOptionDal.Add(new PollOption
                        {
                            Text = optionText.Trim(),
                            PollQuestionId = question.Id,
                            IsActive = true,
                            CreatedAt = DateTime.Now
                        });
                    }
                }
            }

            return new SuccessResult("Anket güncellendi.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User}")]
        [ValidationAspect(typeof(VotePollDtoValidator))]
        public IResult Vote(VotePollDto dto)
        {
            var pollDto = _pollDal.GetByIdAsDto(dto.PollId, _userContext.UserId);
            if (pollDto == null)
                return new ErrorResult("Anket bulunamadı.");

            if (!IsAdmin(_userContext.RoleName) && !PortalUserCanSeePoll(pollDto))
                return new ErrorResult("Anket bulunamadı.");

            var poll = _pollDal.Get(p => p.Id == dto.PollId && p.IsActive);
            if (poll == null)
                return new ErrorResult("Anket bulunamadı.");

            if (poll.EndDate.Date < DateTime.Now.Date)
                return new ErrorResult("Bu anketin süresi dolmuş.");

            if (poll.StartDate > DateTime.Now)
                return new ErrorResult("Bu anket henüz başlamamış.");

            bool isFirstVote = !_pollVoteDal.HasUserVoted(dto.PollId, _userContext.UserId);
            int savedCount = 0;

            foreach (var voteItem in dto.Votes)
            {
                if (_pollVoteDal.HasUserVotedForQuestion(voteItem.PollQuestionId, _userContext.UserId))
                    continue;

                var question = _pollQuestionDal.Get(q => q.Id == voteItem.PollQuestionId && q.PollId == dto.PollId && q.IsActive);
                if (question == null)
                    continue;

                var option = _pollOptionDal.Get(o => o.Id == voteItem.PollOptionId && o.PollQuestionId == voteItem.PollQuestionId && o.IsActive);
                if (option == null)
                    continue;

                _pollVoteDal.Add(new PollVote
                {
                    PollId = dto.PollId,
                    PollQuestionId = voteItem.PollQuestionId,
                    PollOptionId = voteItem.PollOptionId,
                    UserId = _userContext.UserId,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                });
                savedCount++;
            }

            if (savedCount > 0 && isFirstVote)
            {
                poll.TotalParticipants++;
                _pollDal.Update(poll);
            }

            if (savedCount == 0)
                return new ErrorResult("Kaydedilecek oy bulunamadı. Zaten oy kullanmış olabilirsiniz.");

            return new SuccessResult("Oyunuz alındı.");
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public IResult Delete(long id)
        {
            var poll = _pollDal.Get(p => p.Id == id);
            if (poll == null)
                return new ErrorResult("Anket bulunamadı.");

            _pollDal.Delete(poll);
            return new SuccessResult("Anket silindi.");
        }
    }
}
