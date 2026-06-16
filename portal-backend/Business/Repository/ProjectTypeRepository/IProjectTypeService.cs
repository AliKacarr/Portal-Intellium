using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.ProjectTypeRepository
{
    public interface IProjectTypeService
    {
        IResult Add(ProjectType projectType);
        IResult Update(ProjectType projectType);
        IResult Delete(long id);
        IDataResult<List<ProjectType>> GetAll();
        IDataResult<ProjectType> GetById(long id);
    }
}
