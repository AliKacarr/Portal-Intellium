using Core.Utilities.Results.Abstract;
using Entities.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.MailRepository
{
    public interface IMailService
    {
        IResult SendMail(SendMailDto sendMailDto);
    }
}
