namespace Entities.Concrete
{
    public class Product 
    {
        public int Id { get; set; }
        
        // --- 1. ORTAK ALANLAR (Her Üründe Olur) ---
        public string Category { get; set; } // Araba, Laptop, Telefon
        public string Brand { get; set; }    // BMW, Apple, Bosch
        public string Model { get; set; }    // 3.20i, Macbook Pro, No-Frost
        public string SerialNumber { get; set; } // Şase No, Seri No
        public string? BarcodeNumber { get; set; } // Demirbaş Barkodu
        
        // --- 2. ESNEK ALAN (JSON Olarak Tutacağız) ---
        // Laptop ise: {"CPU": "i7", "RAM": "16GB", "Ekran": "15.6"}
        // Araba ise:  {"Plaka": "42KON42", "Yakit": "Dizel", "Vites": "Otomatik"}
        // Sandalye ise: {"Renk": "Siyah", "Kumas": "Deri"}
        public string? TechnicalSpecs { get; set; } 

        public string? Description { get; set; } // Genel notlar (Çizik var vb.)

        // Stok adedi (Depodaki mevcut miktar)
        public int Quantity { get; set; } = 1;
        
        // --- 3. DURUM BİLGİSİ ---
        public DateTime PurchaseDate { get; set; } // Satın Alınma Tarihi (Önemli)
        public string Status { get; set; } = "Depoda"; 
        public int? CurrentDebitId { get; set; } 
    }
}