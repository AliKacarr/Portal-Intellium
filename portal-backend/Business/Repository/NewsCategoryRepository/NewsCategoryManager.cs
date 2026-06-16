using Business.BusinessAspects;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.NewsCategoryRepository;
using Entities.Concrete;

namespace Business.Repository.NewsCategoryRepository
{
    public class NewsCategoryManager : INewsCategoryService
    {
        private readonly INewsCategoryDal _newsCategoryDal;

        public NewsCategoryManager(INewsCategoryDal newsCategoryDal)
        {
            _newsCategoryDal = newsCategoryDal;
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker},{RoleNames.User},{RoleNames.WorkerOutsource}")]
        public IDataResult<List<NewsCategory>> GetAll()
        {
            EnsureDefaultCategoriesIfEmpty();
            var categories = _newsCategoryDal.GetAll(c => c.IsActive);
            return new SuccessDataResult<List<NewsCategory>>(categories);
        }

        private void EnsureDefaultCategoriesIfEmpty()
        {
            if (_newsCategoryDal.GetAll(c => c.IsActive).Count > 0)
                return;

            var now = DateTime.UtcNow;
            var defaults = new (string Name, string? Description)[]
            {
                ("Genel", "Genel haberler"),
                ("Şirket", "Şirket ve kurumsal haberler"),
                ("Teknoloji", "Teknoloji ve yazılım"),
                ("İnsan Kaynakları", "İK ve çalışan haberleri"),
                ("Etkinlik", "Etkinlik ve organizasyon"),
            };

            foreach (var (name, description) in defaults)
            {
                _newsCategoryDal.Add(new NewsCategory
                {
                    Name = name,
                    Description = description,
                    IsActive = true,
                    CreatedAt = now,
                });
            }
        }

        [LoggerAspect]
        public IDataResult<NewsCategory> GetById(long id)
        {
            var category = _newsCategoryDal.Get(c => c.Id == id && c.IsActive);
            if (category == null)
                return new ErrorDataResult<NewsCategory>("Kategori bulunamadı.");
            return new SuccessDataResult<NewsCategory>(category);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker}")]
        public IResult Add(string name, string? description)
        {
            if (string.IsNullOrWhiteSpace(name))
                return new ErrorResult("Kategori adı zorunludur.");

            _newsCategoryDal.Add(new NewsCategory
            {
                Name = name,
                Description = description,
                IsActive = true,
                CreatedAt = DateTime.Now
            });
            return new SuccessResult("Kategori oluşturuldu.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker}")]
        public IResult Update(long id, string name, string? description)
        {
            var category = _newsCategoryDal.Get(c => c.Id == id && c.IsActive);
            if (category == null)
                return new ErrorResult("Kategori bulunamadı.");

            category.Name = name;
            category.Description = description;
            _newsCategoryDal.Update(category);
            return new SuccessResult("Kategori güncellendi.");
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.Admin},{RoleNames.Worker}")]
        public IResult Delete(long id)
        {
            var category = _newsCategoryDal.Get(c => c.Id == id && c.IsActive);
            if (category == null)
                return new ErrorResult("Kategori bulunamadı.");

            category.IsActive = false;
            _newsCategoryDal.Update(category);
            return new SuccessResult("Kategori silindi.");
        }
    }
}
