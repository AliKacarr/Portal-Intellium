using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.PollVoteRepository
{
    public class EfPollVoteDal : EfEntityRepositoryBase<PollVote, PortalContext>, IPollVoteDal
    {
        public bool HasUserVoted(long pollId, long userId)
        {
            using var context = new PortalContext();
            return context.PollVotes.Any(v => v.PollId == pollId && v.UserId == userId && v.IsActive);
        }

        public bool HasUserVotedForQuestion(long pollQuestionId, long userId)
        {
            using var context = new PortalContext();
            return context.PollVotes.Any(v => v.PollQuestionId == pollQuestionId && v.UserId == userId && v.IsActive);
        }
    }
}
