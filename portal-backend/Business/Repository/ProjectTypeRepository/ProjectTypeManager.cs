using Business.BusinessAspects;
using Business.Repository.ProjectTypeRepository.Constants;
using Business.Repository.ProjectTypeRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ProjectTypeRepository;
using Entities.Concrete;

namespace Business.Repository.ProjectTypeRepository
{
	public class ProjectTypeManager : IProjectTypeService
	{
		private readonly IProjectTypeDal _projectTypeDal;

		public ProjectTypeManager(IProjectTypeDal projectTypeDal)
		{
			_projectTypeDal = projectTypeDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(AddProjectTypeValidator))]
		public IResult Add(ProjectType projectType)
		{
			_projectTypeDal.Add(projectType);
			return new SuccessResult(ProjectTypeMessages.AddedProjectType);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(DeleteProjectTypeValidator))]
		public IResult Delete(long id)
		{
			var result = _projectTypeDal.Get(p => p.Id == id);
			_projectTypeDal.Delete(result);
			return new SuccessResult(ProjectTypeMessages.DeletedProjectType);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<ProjectType>> GetAll()
		{
			return new SuccessDataResult<List<ProjectType>>(_projectTypeDal.GetAll());
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<ProjectType> GetById(long id)
		{
			var result = _projectTypeDal.Get(p => p.Id == id);
			if (result == null)
				return new ErrorDataResult<ProjectType>(ProjectTypeMessages.ProjectTypeNotFound);

			return new SuccessDataResult<ProjectType>(result);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		[ValidationAspect(typeof(UpdateProjectTypeValidator))]
		public IResult Update(ProjectType projectType)
		{
			_projectTypeDal.Update(projectType);
			return new SuccessResult(ProjectTypeMessages.UpdatedProjectType);
		}
	}
}
