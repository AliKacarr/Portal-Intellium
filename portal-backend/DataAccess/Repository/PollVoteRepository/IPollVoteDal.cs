using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.PollVoteRepository
{
    public interface IPollVoteDal : IEntityRepository<PollVote>
    {
        bool HasUserVoted(long pollId, long userId);
        bool HasUserVotedForQuestion(long pollQuestionId, long userId);
    }
}
