using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.UserPermissionRepository
{
    public class EfUserPermissionDal : EfEntityRepositoryBase<UserPermission, PortalContext>, IUserPermissionDal
    {
        private readonly PortalContext _context;

        public EfUserPermissionDal(PortalContext context)
        {
            _context = context;
        }

        public UserPermission GetUserPermissionByUserId(long id)
        {
            return _context.UserPermissions.FirstOrDefault(x => x.UserId == id);
        }

        /// <summary>
        /// GetUserPermissionByUserId ile aynı scoped DbContext üzerinden yüklenen satırlar için güncelleme.
        /// Base sınıfın <c>new PortalContext()</c> ile yaptığı Update, takip edilen nesneyi başka context'e taşıyıp
        /// BonusLeave gibi alanların yanlış yazılmasına yol açabiliyordu.
        /// Not: <c>Entry(entity)</c> detached nesneyi çoğu sürümde <c>Unchanged</c> olarak bağlar; sadece
        /// <c>Detached</c> kontrolü yapılırsa <c>Update</c> hiç çağrılmaz (admin bonus güncellemesi sessizce
        /// uygulanmaz veya tutarsız davranır). Her zaman <c>DbSet.Update</c> kullanılır.
        /// </summary>
        public override void Update(UserPermission entity)
        {
            if (entity == null)
                throw new ArgumentNullException(nameof(entity));

            // Aynı Id ile başka bir örnek zaten bu context'te takipteyse çakışır.
            var tracked = _context.UserPermissions.Local.FirstOrDefault(e => e.Id == entity.Id);
            if (tracked != null && !ReferenceEquals(tracked, entity))
                _context.Entry(tracked).State = EntityState.Detached;

            // GetUserPermissionByUserId ile aynı context'te yüklenen satır zaten Unchanged/Modified olabilir;
            // bu durumda Update() gereksiz ve bazı senaryolarda EF/Npgsql tarafında sorun çıkarabiliyor.
            var entry = _context.Entry(entity);
            if (entry.State == EntityState.Detached)
                _context.UserPermissions.Update(entity);

            _context.SaveChanges();
        }
    }
}
