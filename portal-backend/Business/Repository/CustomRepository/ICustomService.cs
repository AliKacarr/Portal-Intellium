using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.CustomRepository
{
    public interface ICustomService
    {
        IResult Add(Custom custom);
        IResult Update(Custom custom);
        IDataResult<List<Custom>> GetAll();
        IResult Delete(int id);
    }
}
