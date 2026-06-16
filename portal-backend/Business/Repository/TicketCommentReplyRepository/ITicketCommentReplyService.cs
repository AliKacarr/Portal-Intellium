using Core.Utilities.Results.Abstract;
using Entities.DTOs.TicketCommentReplyDtos;

namespace Business.Repository.CommentReplyRepository
{
    public interface ITicketCommentReplyService
    {
        IResult Add(AddTicketCommentReplyDto addTicketCommentReply);
        IResult Update(EditTicketCommentReplyDto editTicketCommentReply);
        IResult Delete(long commentReplyId);
        IResult DeleteAllByCommentId(long commentId);
    }
}
