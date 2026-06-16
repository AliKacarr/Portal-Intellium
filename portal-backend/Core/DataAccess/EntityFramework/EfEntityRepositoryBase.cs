using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Core.DataAccess; // IEntityRepository<T> için (Namespace doğruysa)
using System;       // Func<> için
using System.Collections.Generic; // List<> için
using System.Linq; // Where(), ToList() için

namespace Core.DataAccess.EntityFramework
{
    public abstract class EfEntityRepositoryBase<TEntity, TContext> : IEntityRepository<TEntity>
        where TEntity : class, new()
        where TContext : DbContext, new()
    {

        // --- DÜZELTİLMİŞ ADD METODU ---
        public void Add(TEntity entity)
        {
            using (var context = new TContext())
            {
                // context.Entry(entity).State = EntityState.Added; YERİNE BU KULLANILIR:
                context.Add(entity); // veya context.Set<TEntity>().Add(entity);

                // Bu metod, EF Core'un entity'ye bağlı ve henüz takip edilmeyen
                // diğer nesneleri (örn: HealthInfoPremium, HealthInfoDependents)
                // otomatik olarak "Added" state'ine almasını sağlar.

                context.SaveChanges(); // Hem ana hem de ilişkili yeni kayıtlar eklenir.
            }
        }

        public void Delete(TEntity entity)
        {
            using (var context = new TContext())
            {
                // Silme işleminde Entry().State kullanmak genellikle daha güvenlidir,
                // çünkü nesnenin zaten var olduğunu varsayar.
                var deletedEntity = context.Entry(entity); // 'addedEntity' -> 'deletedEntity' (isim düzeltmesi)
                deletedEntity.State = EntityState.Deleted;
                context.SaveChanges();
            }
        }

        public TEntity Get(Expression<Func<TEntity, bool>> filter)
        {
            using (var context = new TContext())
            {
                // FirstOrDefault yerine sadece FirstOrDefault kullanmak yeterli.
                // SingleOrDefault ise tam olarak 1 veya 0 sonuç beklerken kullanılır.
                return context.Set<TEntity>().FirstOrDefault(filter);
            }
        }

        public List<TEntity> GetAll(Expression<Func<TEntity, bool>>? filter = null) // filter'ı nullable yapmak daha modern C#'a uygun
        {
            using (var context = new TContext())
            {
                return filter == null
                    ? context.Set<TEntity>().ToList()
                    : context.Set<TEntity>().Where(filter).ToList();
            }
        }

        public virtual void Update(TEntity entity)
        {
            using (var context = new TContext())
            {
                // Güncelleme işleminde de Entry().State kullanmak yaygındır.
                var updatedEntity = context.Entry(entity); // 'addedEntity' -> 'updatedEntity' (isim düzeltmesi)
                updatedEntity.State = EntityState.Modified;
                context.SaveChanges();
            }
        }
    }
}