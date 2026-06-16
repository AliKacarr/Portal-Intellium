using System.Linq.Expressions;

namespace Core.DataAccess
{
    public interface IEntityRepository<T>
    {
        void Add(T entity);
        void Update(T entity);
        void Delete(T entity);
        List<T> GetAll(Expression<Func<T, bool>> filter = null);//istediğimiz sorguya göre liste çekebilirim. Sorgu boş ise tüm listeyi çeker.
        T Get(Expression<Func<T, bool>> filter);//istediğimiz değere göre veriyi getirebilirim. (id yerine mail ile sorgu yapabilirim)
    }
}
