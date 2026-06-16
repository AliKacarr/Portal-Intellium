using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Helpers;
using Entities.Concrete;
using Entities.DTOs.PollDtos;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.PollRepository
{
    public class EfPollDal : EfEntityRepositoryBase<Poll, PortalContext>, IPollDal
    {
        public List<PollListDto> GetAllAsDto(long currentUserId)
        {
            using var context = new PortalContext();
            return BuildListQuery(context, currentUserId).ToList();
        }

        public List<PollListDto> GetAllAsDtoForPortalUser(long userId)
        {
            using var context = new PortalContext();
            return FilterPollListForPortalUser(context, userId, activeOnly: false);
        }

        public GetPollDto GetByIdAsDto(long pollId, long currentUserId)
        {
            using var context = new PortalContext();

            var pollRow = (
                from p in context.Polls
                where p.Id == pollId
                join u in context.Users on p.CreatedById equals u.Id
                join d in context.Departments on p.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                select new
                {
                    Poll = p,
                    CreatedByName = u.Name,
                    DeptName = dept != null ? dept.Name : null
                }
            ).FirstOrDefault();

            if (pollRow == null) return null;

            var questions = context.PollQuestions
                .Where(q => q.PollId == pollId && q.IsActive)
                .OrderBy(q => q.OrderIndex)
                .ToList();

            var questionIds = questions.Select(q => q.Id).ToList();

            var options = context.PollOptions
                .Where(o => questionIds.Contains(o.PollQuestionId) && o.IsActive)
                .ToList();

            var votes = context.PollVotes
                .Where(v => v.PollId == pollId && v.IsActive)
                .ToList();

            var userVotes = votes.Where(v => v.UserId == currentUserId).ToList();
            var p2 = pollRow.Poll;

            var questionDtos = questions.Select(q =>
            {
                var qOptions = options.Where(o => o.PollQuestionId == q.Id).ToList();
                var qVotes = votes.Where(v => v.PollQuestionId == q.Id).ToList();
                var totalQVotes = qVotes.Count;
                var userQVote = userVotes.FirstOrDefault(v => v.PollQuestionId == q.Id);

                return new GetPollQuestionDto
                {
                    Id = q.Id,
                    Text = q.Text,
                    OrderIndex = q.OrderIndex,
                    HasVoted = userQVote != null,
                    UserVotedOptionId = userQVote?.PollOptionId,
                    Options = qOptions.Select(o => new PollOptionDto
                    {
                        Id = o.Id,
                        Text = o.Text,
                        VoteCount = qVotes.Count(v => v.PollOptionId == o.Id),
                        VotePercentage = totalQVotes > 0
                            ? Math.Round((double)qVotes.Count(v => v.PollOptionId == o.Id) / totalQVotes * 100, 1)
                            : 0
                    }).ToList()
                };
            }).ToList();

            return new GetPollDto
            {
                Id = p2.Id,
                Title = p2.Title,
                Content = p2.Content,
                StartDate = p2.StartDate,
                EndDate = p2.EndDate,
                ViewCount = p2.ViewCount,
                TotalParticipants = p2.TotalParticipants,
                IsGeneral = p2.IsGeneral,
                IsActive = p2.IsActive,
                IsExpired = p2.EndDate.Date < DateTime.Now.Date,
                CreatedAt = p2.CreatedAt,
                DepartmentId = p2.DepartmentId,
                DepartmentName = pollRow.DeptName,
                CreatedById = p2.CreatedById,
                CreatedByName = pollRow.CreatedByName,
                HasVoted = userVotes.Count > 0,
                Questions = questionDtos
            };
        }

        public List<PollListDto> GetActivePolls(long currentUserId)
        {
            using var context = new PortalContext();
            var today = DateTime.Now;
            return (
                from p in context.Polls
                where p.IsActive && p.EndDate.Date >= today.Date && p.StartDate <= today
                join u in context.Users on p.CreatedById equals u.Id
                join d in context.Departments on p.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                orderby p.CreatedAt descending
                select new PollListDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    QuestionCount = context.PollQuestions.Count(q => q.PollId == p.Id && q.IsActive),
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    TotalParticipants = p.TotalParticipants,
                    IsGeneral = p.IsGeneral,
                    IsActive = p.IsActive,
                    IsExpired = false,
                    HasVoted = context.PollVotes.Any(v => v.PollId == p.Id && v.UserId == currentUserId && v.IsActive),
                    DepartmentName = dept != null ? dept.Name : null,
                    CreatedByName = u.Name,
                    CreatedAt = p.CreatedAt
                }
            ).ToList();
        }

        public List<PollListDto> GetActivePollsForPortalUser(long userId)
        {
            using var context = new PortalContext();
            return FilterPollListForPortalUser(context, userId, activeOnly: true);
        }

        private static List<PollListDto> FilterPollListForPortalUser(
            PortalContext context,
            long userId,
            bool activeOnly)
        {
            var scope = PortalBolumScope.Resolve(context, userId);
            var today = DateTime.Now;
            var todayDate = today.Date;

            var polls = context.Polls.AsNoTracking()
                .Where(p => p.IsActive && (!activeOnly || (p.EndDate.Date >= todayDate && p.StartDate <= today)));

            polls = PortalBolumScope.ApplyPollVisibilityFilter(polls, scope);

            var rows = (
                from p in polls
                join u in context.Users on p.CreatedById equals u.Id
                join d in context.Departments on p.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                orderby p.CreatedAt descending
                select new
                {
                    p.Id,
                    p.Title,
                    p.StartDate,
                    p.EndDate,
                    p.TotalParticipants,
                    p.IsGeneral,
                    p.DepartmentId,
                    DepartmentName = dept != null ? dept.Name : null,
                    CreatedByName = u.Name,
                    p.CreatedAt
                }).ToList();

            var pollIds = rows.Select(r => r.Id).ToList();
            var questionCounts = context.PollQuestions
                .Where(q => pollIds.Contains(q.PollId) && q.IsActive)
                .GroupBy(q => q.PollId)
                .Select(g => new { PollId = g.Key, Count = g.Count() })
                .ToDictionary(x => x.PollId, x => x.Count);

            var votedPollIds = context.PollVotes
                .Where(v => pollIds.Contains(v.PollId) && v.UserId == userId && v.IsActive)
                .Select(v => v.PollId)
                .Distinct()
                .ToHashSet();

            return rows
                .Select(p => new PollListDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    QuestionCount = questionCounts.TryGetValue(p.Id, out var qc) ? qc : 0,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    TotalParticipants = p.TotalParticipants,
                    IsGeneral = p.IsGeneral,
                    IsExpired = p.EndDate.Date < todayDate,
                    HasVoted = votedPollIds.Contains(p.Id),
                    DepartmentName = p.DepartmentName,
                    CreatedByName = p.CreatedByName,
                    CreatedAt = p.CreatedAt
                })
                .ToList();
        }

        private static IQueryable<PollListDto> BuildListQuery(PortalContext context, long currentUserId)
        {
            var today = DateTime.Now;
            return
                from p in context.Polls
                join u in context.Users on p.CreatedById equals u.Id
                join d in context.Departments on p.DepartmentId equals (long?)d.Id into depts
                from dept in depts.DefaultIfEmpty()
                orderby p.CreatedAt descending
                select new PollListDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    QuestionCount = context.PollQuestions.Count(q => q.PollId == p.Id && q.IsActive),
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    TotalParticipants = p.TotalParticipants,
                    IsGeneral = p.IsGeneral,
                    IsActive = p.IsActive,
                    IsExpired = p.EndDate.Date < today.Date,
                    HasVoted = context.PollVotes.Any(v => v.PollId == p.Id && v.UserId == currentUserId && v.IsActive),
                    DepartmentName = dept != null ? dept.Name : null,
                    CreatedByName = u.Name,
                    CreatedAt = p.CreatedAt
                };
        }
    }
}
