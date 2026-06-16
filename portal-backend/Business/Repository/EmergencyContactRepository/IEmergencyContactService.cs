using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.EmergencyContactDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.EmergencyContactRepository
{
    public interface IEmergencyContactService
    {
        IResult Add(AddEmergencyContactDto emergencyContactDto);
        IResult Update(UpdateEmergencyContactDto emergencyContactDto);
        IResult Delete(long id);
        IResult PrimaryChange(long id);
        IDataResult<List<EmergencyContact>> GetAllById(long Userid);
    }
}
