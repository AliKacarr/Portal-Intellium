using Business.BusinessAspects;
using Business.Repository.BoardMemberRepository.Constants;
using Business.Repository.BoardMemberRepository.Validations;
using Business.Repository.NotificationRepository; // ✅ EKLENDİ
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Exceptions;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.BoardRepository;
using Entities.Concrete;
using Entities.DTOs.BoardMemberDtos;
using Entities.DTOs.NotificationDtos; // ✅ EKLENDİ
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.BoardMemberRepository
{
    public class BoardMemberManager : IBoardMemberService
    {
        private readonly IBoardMemberDal _boardMemberDal;
        private readonly INotificationService _notificationService; // ✅ Bildirim Servisi
        private readonly IBoardDal _boardDal; // ✅ Pano ismini çekmek için

        public BoardMemberManager(IBoardMemberDal boardMemberDal, INotificationService notificationService, IBoardDal boardDal)
        {
            _boardMemberDal = boardMemberDal;
            _notificationService = notificationService;
            _boardDal = boardDal;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddBoardMemberValidator))]
        public IResult Add(AddBoardMembersDto boardMembers)
        {
            var existingUserIds = _boardMemberDal.GetAll(bm => bm.BoardId == boardMembers.BoardId)
                                                 .Select(bm => bm.UserId)
                                                 .ToList();

            var newUsersToAdd = boardMembers.UserIds.Except(existingUserIds).ToList();
            if (!newUsersToAdd.Any())
                throw new BadRequestException(BoardMemberMessages.NoUsersToAssign);

            // ✅ Bildirim için Panonun ismini çekelim
            var board = _boardDal.Get(b => b.Id == boardMembers.BoardId);

            foreach (var userId in newUsersToAdd)
            {
                _boardMemberDal.Add(new BoardMember { BoardId = boardMembers.BoardId, UserId = userId });

                // --- 🔥 BİLDİRİM: YENİ PANO ÜYELİĞİ 🔥 ---
                if (board != null)
                {
                    _notificationService.Add(new AddNotificationDto
                    {
                        AssignedUserId = userId,
                        Title = "Yeni Pano Üyeliği",
                        Content = $"'{board.Name}' isimli panoya/projeye dahil edildiniz.",
                        Type = "scrumTask", // Tıklayınca Scrum Board'a gider
                        ReferenceId = boardMembers.BoardId.ToString() // Panonun ID'si
                    });
                }
                // ------------------------------------------
            }
            return new SuccessResult(BoardMemberMessages.BoardMembersAssignedSuccessfully);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteBoardMemberValidator))]
        public IResult Delete(int boardMemberId)
        {
            var result = _boardMemberDal.Get(p => p.Id.Equals(boardMemberId));
            _boardMemberDal.Delete(result);
            return new SuccessResult(BoardMemberMessages.BoardMemberDeletedSuccessfully);
        }

        public IResult DeleteAll(List<BoardMember> boardMembers)
        {
            if (boardMembers.IsNullOrEmpty()) return new ErrorResult();
            foreach (var boardMember in boardMembers)
            {
                var result = _boardMemberDal.Get(p => p.Id.Equals(boardMember.Id));
                if (result != null)
                    _boardMemberDal.Delete(result);
            }
            return new SuccessResult();
        }

        public IDataResult<List<BoardMember>> GetAllByBoardId(int boardId)
        {
            var result = _boardMemberDal.GetAll(p => p.BoardId.Equals(boardId));
            return new SuccessDataResult<List<BoardMember>>(result);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(GetAllBoardMemberValidator))]
        public IDataResult<List<BoardMemberDto>> GetAllByBoardIdWithUsers(int boardId)
        {
            var result = _boardMemberDal.GetAllByBoardIdWithUsers(boardId);
            return new SuccessDataResult<List<BoardMemberDto>>(result);
        }
    }
}