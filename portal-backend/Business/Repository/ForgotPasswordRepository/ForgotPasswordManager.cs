using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ForgotPasswordRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.ForgotPasswordRepository
{
    public class ForgotPasswordManager : IForgotPasswordService
    {
        private readonly IForgotPasswordDal _forgotPasswordDal;

        public ForgotPasswordManager(IForgotPasswordDal forgotPasswordDal)
        {
            _forgotPasswordDal = forgotPasswordDal;
        }

        public IDataResult<ForgotPassword> CreateForgotPassword(User user)
        {
            ForgotPassword forgotPassword = new()
            {
                UserId = user.Id,
                SendDate = DateTime.Now,
                Value=Guid.NewGuid().ToString(),
                IsActive = true
            };
            _forgotPasswordDal.Add(forgotPassword);
            return new SuccessDataResult<ForgotPassword>(forgotPassword);
        }

        public ForgotPassword GetForgotPassword(string value)
        {
           return _forgotPasswordDal.Get(p=>p.Value == value);
        }

        public IDataResult<List<ForgotPassword>> GetListByUserId(long userId)
        {
            return new SuccessDataResult<List<ForgotPassword>> (_forgotPasswordDal.GetAll(p=>p.UserId==userId && p.IsActive==true));
        }

        public void Update(ForgotPassword forgotPassword)
        {
            _forgotPasswordDal.Update(forgotPassword);
        }
    }
}
