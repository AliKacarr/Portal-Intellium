using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.CustomRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.CustomRepository
{
    public class CustomManager : ICustomService
    {
        private readonly ICustomDal _customDal;

        public CustomManager(ICustomDal customDal)
        {
            _customDal = customDal;
        }

        public IResult Add(Custom custom)
        {
            _customDal.Add(custom);
            return new SuccessResult(CustomMessages.AddedCustom);
        }

        public IResult Delete(int id)
        {
            var custom = _customDal.Get(x => x.Id == id);
            if(custom == null)
            {
                return new ErrorResult(CustomMessages.NotFound);
            }
            _customDal.Delete(custom);
            return new SuccessResult(CustomMessages.DeletedCustom);

        }

        public IDataResult<List<Custom>> GetAll()
        {
            return new SuccessDataResult<List<Custom>>(_customDal.GetAll());
        }

        public IResult Update(Custom custom)
        {
            _customDal.Update(custom);
            return new SuccessResult(CustomMessages.UpdatedCustom);

        }
    }
}
