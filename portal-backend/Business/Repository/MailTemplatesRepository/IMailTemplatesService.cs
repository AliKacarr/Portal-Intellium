using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.MailTemplatesRepository
{
    public interface IMailTemplatesService
    {
        IResult Add(MailTemplates mailTemplates);
        IResult Delete(MailTemplates mailTemplates);
        IResult Update(MailTemplates mailTemplates);
        IDataResult<MailTemplates> Get(long id);
        IDataResult<MailTemplates> GetByTemplateName(string name,long customerId);
        IDataResult<List<MailTemplates>> GetAll(long customerId);

    }
}
