using Business.Repository.MailRepository.Constans;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.MailRepository;
using Entities.Concrete;

namespace Business.Repository.MailRepository
{
    public class MailParameterManager : IMailParameterService
    {
        private readonly IMailParameterDal _mailParameterDal;

        public MailParameterManager(IMailParameterDal mailParameterDal)
        {
            _mailParameterDal = mailParameterDal;
        }

        public IDataResult<MailParameters> GetParameters(long customerId)
        {
            return new SuccessDataResult<MailParameters>(_mailParameterDal.Get(m => m.CustomerId == customerId));
        }

        public IResult Update(MailParameters mailParameters)
        {
            var result = GetParameters(mailParameters.CustomerId);
            if (result.Data == null)
            {
                _mailParameterDal.Add(mailParameters);
            }
            else
            {
                result.Data.Port = mailParameters.Port;
                result.Data.SSL = mailParameters.SSL;
                result.Data.User = mailParameters.User;
                result.Data.Password = mailParameters.Password;
                result.Data.SMTP = mailParameters.SMTP;
                result.Data.FromEmail = mailParameters.FromEmail;
                result.Data.FromName = mailParameters.FromName;

                _mailParameterDal.Update(result.Data);
            }
            return new SuccessResult(MailMessages.AddedMailParameters);
        }
    }
}
