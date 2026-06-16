using Entities.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.MailRepository
{
    public interface IMailDal
    {
        void SendMail(SendMailDto sendMailDto);
    }
}
