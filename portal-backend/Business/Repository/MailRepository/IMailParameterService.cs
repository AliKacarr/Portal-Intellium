using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.MailRepository
{
    public interface IMailParameterService
    {
        IResult Update(MailParameters mailParameters);
        IDataResult<MailParameters> GetParameters(long customerId);

    }
}
