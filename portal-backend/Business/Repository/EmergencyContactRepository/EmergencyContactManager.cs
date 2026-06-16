using Business.BusinessAspects; // ✅ LoggerAspect için eklendi
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.EmergencyContactRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs.EmergencyContactDtos;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;

namespace Business.Repository.EmergencyContactRepository
{
    public class EmergencyContactManager : IEmergencyContactService
    {
        private readonly IEmergencyContactDal _contactDal;
        private readonly IUserDal _userDal;

        public EmergencyContactManager(IEmergencyContactDal contactDal, IUserDal userDal)
        {
            _contactDal = contactDal;
            _userDal = userDal;
        }

        // 🔥 LOGLAMA EKLENDİ: Yeni kişi eklendiğinde log düşer.
        [LoggerAspect]
        public IResult Add(AddEmergencyContactDto dto)
        {
            var user = _userDal.Get(x => x.Id == dto.UserId);
            if (user == null)
                return new ErrorResult("Kullanıcı Bulunamadı");

            var hasAnyForUser = _contactDal.Get(x => x.UserId == dto.UserId) != null;

            _contactDal.Add(new EmergencyContact
            {
                Id = 0,
                UserId = dto.UserId,
                FullName = dto.FullName,
                RelationShip = dto.RelationShip,
                PhoneNumber = dto.PhoneNumber,
                WorkPhoneNumber = dto.WorkPhoneNumber,
                EMail = dto.EMail,
                Address = dto.Address,
                IsPrimary = !hasAnyForUser // ilk kayıt otomatik birincil
            });

            return new SuccessResult("Ekleme işlemi başarılı.");
        }

        // 🔥 LOGLAMA EKLENDİ: Kişi silindiğinde log düşer.
        [LoggerAspect]
        public IResult Delete(long id)
        {
            var contact = _contactDal.Get(x => x.Id == id);
            if (contact == null)
                return new ErrorResult("Silinecek kullanıcı bulunamadı");

            _contactDal.Delete(contact);
            return new SuccessResult("Silme işlemi tamamlandı.");
        }

        // LIST (Loglanmasına gerek yok, sadece okuma yapıyor)
        public IDataResult<List<EmergencyContact>> GetAllById(long userId)
        {
            var user = _userDal.Get(x => x.Id == userId);
            if (user == null)
                return new ErrorDataResult<List<EmergencyContact>>("Kullanıcı Bulunamadı");

            var contactList = _contactDal.GetAll(x => x.UserId == userId) ?? new List<EmergencyContact>();
            return new SuccessDataResult<List<EmergencyContact>>(contactList, "Kayıtlar getirildi.");
        }

        // 🔥 LOGLAMA EKLENDİ: Birincil kişi değiştirildiğinde log düşer.
        [LoggerAspect]
        public IResult PrimaryChange(long id)
        {
            var contact = _contactDal.Get(x => x.Id == id);
            if (contact == null)
                return new ErrorResult("Acil durum kişisi bulunamadı");

            var userId = contact.UserId;

            // Sadece BU kullanıcıya ait mevcut birincilleri indir
            var primariesOfUser = _contactDal.GetAll(x => x.UserId == userId && x.IsPrimary && x.Id != id);
            if (!primariesOfUser.IsNullOrEmpty())
            {
                foreach (var p in primariesOfUser)
                {
                    if (p.IsPrimary)
                    {
                        p.IsPrimary = false;
                        _contactDal.Update(p);
                    }
                }
            }

            // Hedef kaydı birincil yap
            if (!contact.IsPrimary)
            {
                contact.IsPrimary = true;
                _contactDal.Update(contact);
            }

            return new SuccessResult("Güncelleme Başarılı");
        }

        // 🔥 LOGLAMA EKLENDİ: Kişi bilgisi güncellendiğinde log düşer.
        [LoggerAspect]
        public IResult Update(UpdateEmergencyContactDto dto)
        {
            var user = _userDal.Get(x => x.Id == dto.UserId);
            if (user == null)
                return new ErrorResult("Kullanıcı Bulunamadı");

            var contact = _contactDal.Get(x => x.Id == dto.Id);
            if (contact == null)
                return new ErrorResult("Güncellenecek acil durum kişisi bulunamadı");

            if (dto.IsPrimary)
            {
                var others = _contactDal.GetAll(x =>
                    x.UserId == dto.UserId && x.IsPrimary && x.Id != dto.Id);
                if (!others.IsNullOrEmpty())
                {
                    foreach (var p in others)
                    {
                        if (p.IsPrimary)
                        {
                            p.IsPrimary = false;
                            _contactDal.Update(p);
                        }
                    }
                }
            }

            _contactDal.Update(new EmergencyContact
            {
                Id = dto.Id,
                UserId = dto.UserId,
                FullName = dto.FullName,
                RelationShip = dto.RelationShip,
                PhoneNumber = dto.PhoneNumber,
                WorkPhoneNumber = dto.WorkPhoneNumber,
                EMail = dto.EMail,
                Address = dto.Address,
                IsPrimary = dto.IsPrimary
            });

            return new SuccessResult("Güncelleme Başarılı");
        }
    }
}