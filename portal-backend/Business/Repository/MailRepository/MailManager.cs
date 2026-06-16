using Business.Repository.MailRepository.Constans;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.MailRepository;
using Entities.DTOs;

namespace Business.Repository.MailRepository
{
    public class MailManager : IMailService
    {
        private readonly IMailDal _mailDal;

        public MailManager(IMailDal mailDal)
        {
            _mailDal = mailDal;
        }

        public IResult SendMail(SendMailDto sendMailDto)
        {
            _mailDal.SendMail(sendMailDto);
            return new SuccessResult(MailMessages.MailSendSuccesfull);
        }
    }
}
