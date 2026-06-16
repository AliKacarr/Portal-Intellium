using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.DebitRepository;
using DataAccess.Repository.ProductRepository;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.ProductRepository
{
    public class ProductManager : IProductService
    {
        private readonly IProductDal _productDal;
        private readonly IDebitDal _debitDal;

        public ProductManager(IProductDal productDal, IDebitDal debitDal)
        {
            _productDal = productDal;
            _debitDal = debitDal;
        }

        public IResult Add(Product product)
        {
            if (string.IsNullOrWhiteSpace(product.Brand))
                return new ErrorResult("Marka zorunludur.");
            if (string.IsNullOrWhiteSpace(product.Model))
                return new ErrorResult("Model zorunludur.");
            if (string.IsNullOrWhiteSpace(product.SerialNumber))
                return new ErrorResult("Seri / şase numarası zorunludur.");
            if (product.Quantity <= 0)
                return new ErrorResult("Ürün adeti 1 veya daha büyük olmalıdır.");

            // Seri no kontrolü (Opsiyonel)
            if (_productDal.GetAll(p => p.SerialNumber == product.SerialNumber).Any())
            {
                return new ErrorResult("Bu seri numarasıyla kayıtlı bir ürün zaten var.");
            }

            if (product.PurchaseDate == default(DateTime))
                product.PurchaseDate = DateTime.UtcNow.Date;

            product.Status = product.Quantity > 0 ? "Depoda" : "Zimmetli";
            _productDal.Add(product);
            // EF Id'yi set eder; Stoğa Ekle akışında DebitRequest'e bağlamak için geri dönüyoruz
            return new SuccessDataResult<Product>(product, "Ürün envantere eklendi.");
        }

        public IResult Update(Product product)
        {
            if (string.IsNullOrWhiteSpace(product.Brand))
                return new ErrorResult("Marka zorunludur.");
            if (string.IsNullOrWhiteSpace(product.Model))
                return new ErrorResult("Model zorunludur.");
            if (string.IsNullOrWhiteSpace(product.SerialNumber))
                return new ErrorResult("Seri / şase numarası zorunludur.");
            // Zimmet sonrası stok 0 olabilir; 0 adet = tamamı zimmette (DebitManager bu durumu yazar).
            if (product.Quantity < 0)
                return new ErrorResult("Ürün adedi negatif olamaz.");

            // Eski veriyi çekip durumunu kontrol edelim
            var oldProduct = _productDal.Get(p => p.Id == product.Id);

            if (oldProduct == null) return new ErrorResult("Ürün bulunamadı.");

            // SENARYO: Ürün "Zimmetli" iken "Depoda"ya çekiliyorsa (Zimmet İadesi)
            if (oldProduct.Status == "Zimmetli" && product.Status == "Depoda")
            {
                // 1. Aktif zimmet kaydını bul (CurrentDebitId varsa)
                if (oldProduct.CurrentDebitId != null && oldProduct.CurrentDebitId > 0)
                {
                    var debit = _debitDal.Get(d => d.Id == oldProduct.CurrentDebitId);
                    if (debit != null)
                    {
                        // Zimmeti kapat
                        debit.Status = "İade Edildi";
                        // Eğer Debit entity'inde ReturnDate varsa onu da set et: 
                        // debit.ReturnDate = DateTime.Now; 
                        _debitDal.Update(debit);
                    }
                }
                
                // 2. Ürünün üzerindeki zimmet bilgisini temizle
                product.CurrentDebitId = null;
            }
            
            // Eğer tam tersi, elle "Depoda"dan "Zimmetli" yapmaya çalışıyorsa uyaralım
            // Çünkü zimmetleme işlemi AssignModal üzerinden yapılmalı (Kişi seçilmeli)
            if (oldProduct.Status == "Depoda" && product.Status == "Zimmetli")
            {
                // Kullanıcı seçilmediği için bu yasaklanabilir veya serbest bırakılabilir.
                // Şimdilik serbest bırakıyoruz ama CurrentDebitId boş kalır.
            }

            // Stok adedine göre durumu normalize et
            if (product.Quantity <= 0)
                product.Status = "Zimmetli";
            else if (string.Equals(product.Status, "Zimmetli", StringComparison.OrdinalIgnoreCase)
                     && (product.CurrentDebitId == null || product.CurrentDebitId == 0))
            {
                // Aktif zimmet satırı varken "Depoda"ya zorlama; aksi halde zimmetli ürün envanterde yanlışlıkla "Zimmetle" butonu görünür.
                product.Status = "Depoda";
            }

            _productDal.Update(product);
            return new SuccessResult("Ürün güncellendi.");
        }

        public IResult Delete(Product product)
        {
            _productDal.Delete(product);
            return new SuccessResult("Ürün silindi.");
        }

        public IDataResult<List<Product>> GetAll()
        {
            return new SuccessDataResult<List<Product>>(_productDal.GetAll());
        }

        public IDataResult<Product> GetById(int id)
        {
            return new SuccessDataResult<Product>(_productDal.Get(p => p.Id == id));
        }

        public IDataResult<List<Product>> GetAvailableProducts()
        {
            return new SuccessDataResult<List<Product>>(_productDal.GetAll(p => p.Status == "Depoda" && p.Quantity > 0));
        }
    }
}