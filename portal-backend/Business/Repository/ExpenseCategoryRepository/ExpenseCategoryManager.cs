using Business.BusinessAspects;
using Business.Repository.ExpenseCategoryRepository.Constants;
using Business.Repository.ExpenseCategoryRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ExpenseCategoryRepository;
using Entities.Concrete;
using Entities.DTOs.ExpenseCategoryDto;
using Newtonsoft.Json;

namespace Business.Repository.ExpenseCategoryRepository
{
    public class ExpenseCategoryManager : IExpenseCategoryService
    {
        private readonly IExpenseCategoryDal _expenseCategoryDal;

        public ExpenseCategoryManager(IExpenseCategoryDal expenseCategoryDal)
        {
            _expenseCategoryDal = expenseCategoryDal;
        }

        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<ExpenseCategoryResponseDto>> GetAll()
        {
            var categories = _expenseCategoryDal.GetAll();
            var dtos = categories.Select(c => ToResponseDto(c)).ToList();
            return new SuccessDataResult<List<ExpenseCategoryResponseDto>>(dtos, ExpenseCategoryMessages.CategoryListed);
        }

        [ValidationAspect(typeof(AddExpenseCategoryDtoValidator))]
        [SecuredOperation(RoleNames.Admin)]
        public IResult Add(AddExpenseCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Value))
                return new ErrorResult(ExpenseCategoryMessages.CategoryNameRequired);

            var value = dto.Value.Trim();
            if (ValueOrAliasExists(value, excludeCategoryId: null))
                return new ErrorResult(ExpenseCategoryMessages.CategoryAlreadyExists);

            var category = new ExpenseCategory
            {
                Value = value,
                System = false,
                Visible = true,
                AliasesJson = "[]"
            };
            _expenseCategoryDal.Add(category);
            return new SuccessResult(ExpenseCategoryMessages.CategoryAdded);
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult Update(int id, UpdateExpenseCategoryDto dto)
        {
            var category = _expenseCategoryDal.Get(c => c.Id == id);
            if (category == null)
                return new ErrorResult(ExpenseCategoryMessages.CategoryNotFound);

            // Tüm kategoriler: visible açılıp kapatılabilir
            if (dto.Visible.HasValue)
                category.Visible = dto.Visible.Value;

            // Ad değiştirme (rename): sadece özel kategorilerde
            if (!string.IsNullOrWhiteSpace(dto.Value))
            {
                if (category.System)
                    return new ErrorResult(ExpenseCategoryMessages.SystemCategoryCannotBeRenamed);

                var newValue = dto.Value.Trim();
                if (newValue != category.Value)
                {
                    if (ValueOrAliasExists(newValue, excludeCategoryId: id))
                        return new ErrorResult(ExpenseCategoryMessages.CategoryAlreadyExists);

                    var aliases = ParseAliases(category.AliasesJson);
                    if (!aliases.Contains(category.Value, StringComparer.OrdinalIgnoreCase))
                        aliases.Add(category.Value);
                    category.AliasesJson = JsonConvert.SerializeObject(aliases);
                    category.Value = newValue;
                }
            }

            _expenseCategoryDal.Update(category);
            return new SuccessResult(ExpenseCategoryMessages.CategoryUpdated);
        }

        [SecuredOperation(RoleNames.Admin)]
        public IResult Delete(int id)
        {
            var category = _expenseCategoryDal.Get(c => c.Id == id);
            if (category == null)
                return new ErrorResult(ExpenseCategoryMessages.CategoryNotFound);

            if (category.System)
                return new ErrorResult(ExpenseCategoryMessages.SystemCategoryCannotBeDeleted);

            _expenseCategoryDal.Delete(category);
            return new SuccessResult(ExpenseCategoryMessages.CategoryDeleted);
        }

        private static ExpenseCategoryResponseDto ToResponseDto(ExpenseCategory c)
        {
            return new ExpenseCategoryResponseDto
            {
                Id = c.Id,
                Value = c.Value,
                System = c.System,
                Visible = c.Visible,
                Aliases = ParseAliases(c.AliasesJson)
            };
        }

        /// <summary>value veya herhangi bir kategorinin aliases'inde bu isim var mı kontrol eder.</summary>
        private bool ValueOrAliasExists(string value, int? excludeCategoryId)
        {
            var all = _expenseCategoryDal.GetAll(c => excludeCategoryId == null || c.Id != excludeCategoryId.Value);
            var comparer = StringComparer.OrdinalIgnoreCase;
            foreach (var c in all)
            {
                if (comparer.Equals(c.Value, value)) return true;
                var aliases = ParseAliases(c.AliasesJson);
                if (aliases.Any(a => comparer.Equals(a, value))) return true;
            }
            return false;
        }

        private static List<string> ParseAliases(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();
            try
            {
                var list = JsonConvert.DeserializeObject<List<string>>(json);
                return list ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }
}
