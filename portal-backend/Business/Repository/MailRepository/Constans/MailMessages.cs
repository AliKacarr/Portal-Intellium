using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.MailRepository.Constans
{
    public class MailMessages
    {
        public static string AddedMailParameters = "Mail parametreleri başarıyla eklendi.";
        public static string MailSendSuccesfull = "Mail başarıyla gönderildi.";
        public static string MailConfirmSendSuccesfull = "Onay maili tekrar gönderildi.";
        public static string MailAlreadyConfirm = "Mail zaten onaylanmış. Gönderim yapılmadı.";
        public static string MailConfirmTimeHasNotExpired = "Mail onayını 5 dakikada bir gönderebilirsiniz.";
    }
}
