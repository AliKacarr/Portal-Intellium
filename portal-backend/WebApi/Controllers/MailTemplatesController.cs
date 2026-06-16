using Business.Repository.MailTemplatesRepository;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MailTemplatesController : ControllerBase
    {
        private readonly IMailTemplatesService _mailTemplatesService;

        public MailTemplatesController(IMailTemplatesService mailTemplatesService)
        {
            _mailTemplatesService = mailTemplatesService;
        }

        //[HttpPost("add")]
        //public IActionResult Add(MailTemplates mailTemplates)
        //{
        //    var result=_mailTemplatesService.Add(mailTemplates);
        //    if (result.Success)
        //    {
        //        return Ok(result);
        //    }
        //    return BadRequest(result.Message);
        //}
    }
}
