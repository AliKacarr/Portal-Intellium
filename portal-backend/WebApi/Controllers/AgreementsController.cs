using Business.Repository.AgreementRepository;
using Core.Identity;
using Entities.DTOs.AgreementDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AgreementsController : ControllerBase
    {
        private readonly IAgreementService _agreementService;
        private readonly IUserContext _userContext;

        public AgreementsController(IAgreementService agreementService, IUserContext userContext)
        {
            _agreementService = agreementService;
            _userContext = userContext;
        }

        [HttpGet("active")]
        public IActionResult GetActive()
        {
            var result = _agreementService.GetActive();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("history")]
        public IActionResult GetHistory()
        {
            var result = _agreementService.GetHistory();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public IActionResult Add(CreateAgreementDto agreementDto)
        {
            var result = _agreementService.AddVersion(agreementDto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [Authorize]
        [HttpPost("accept")]
        public IActionResult Accept(AcceptAgreementsDto acceptAgreementsDto)
        {
            var result = _agreementService.AcceptActiveAgreements(_userContext.UserId, acceptAgreementsDto.AgreementIds);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
