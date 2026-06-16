namespace Business.Repository.TicketRepository.Constants
{
    public static class TicketMessages
    {
        public const string AddedTicket = "Ticket kaydı başarıyla eklendi.";
        public const string UpdatedTicket = "Ticket kaydı başarıyla güncellendi.";
        public const string DeletedTicket = "Ticket kaydı başarıyla silindi.";
        public const string TicketNotFound = "Ticket bulunamadı.";
        public const string TicketListed = "Ticket başarıyla listelendi.";
        public const string TicketAlreadyHaveAssignedUser = "Bu ticket zaten atanmış bir kullanıcıya sahip.";
        public const string TicketAlreadyResolved = "Bu ticket zaten atanmış bir kullanıcıya sahip.";
        public const string TicketAssignedToUser = "Ticket başarıyla kullanıcıya atandı.";
        public const string TicketResolved = "Bilet başarıyla çözüldü.";
        public const string TicketNameCanNotBeEmpty = "Bilet adı boş olamaz.";
        public const string TicketNotAssigned = "Bilet atanmamış.";
    }
}
