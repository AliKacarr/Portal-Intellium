namespace Entities.DTOs.EmergencyContactDtos
{
    public class AddEmergencyContactDto
    {

        public long UserId { get; set; }

        public string FullName { get; set; }

        public string RelationShip { get; set; }

        public string PhoneNumber { get; set; }
        public string WorkPhoneNumber { get; set; }

        public string EMail { get; set; }

        public string Address { get; set; }



    }
}
