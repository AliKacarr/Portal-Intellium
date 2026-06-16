using Business.Repository.MailTemplatesRepository.Constants;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.MailRepository;
using Entities.Concrete;

namespace Business.Repository.MailTemplatesRepository
{
    public class MailTemplatesManager : IMailTemplatesService
    {
        private readonly IMailTemplatesDal _mailTemplatesDal;



        public MailTemplatesManager(IMailTemplatesDal mailTemplatesDal)
        {
            _mailTemplatesDal = mailTemplatesDal;
        }

        public IResult Add(MailTemplates mailTemplates)
        {
            _mailTemplatesDal.Add(mailTemplates);
            return new SuccessResult(MailTemplatesMessages.AddedMailTemplates);
        }

        public IResult Delete(MailTemplates mailTemplates)
        {
            _mailTemplatesDal.Delete(mailTemplates);
            return new SuccessResult(MailTemplatesMessages.DeletedMailTemplates);
        }

        public IDataResult<MailTemplates> Get(long id)
        {
            return new SuccessDataResult<MailTemplates>(_mailTemplatesDal.Get(m => m.Id == id));
        }

        public IDataResult<List<MailTemplates>> GetAll(long customerId)
        {
            return new SuccessDataResult<List<MailTemplates>>(_mailTemplatesDal.GetAll(m => m.CustomerId == customerId));
        }

        public IDataResult<MailTemplates> GetByTemplateName(string name, long customerId)
        {
            return new SuccessDataResult<MailTemplates>(_mailTemplatesDal.Get(m => m.Type == name && m.CustomerId == customerId));
        }

        public IResult Update(MailTemplates mailTemplates)
        {
            _mailTemplatesDal.Update(mailTemplates);
            return new SuccessResult(MailTemplatesMessages.UpdatedMailTemplates);
        }
    }
}
