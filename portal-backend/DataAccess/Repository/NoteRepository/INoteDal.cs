using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.NoteRepository
{
    public interface INoteDal : IEntityRepository<Note>
    {
    }
}
