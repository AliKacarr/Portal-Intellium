export const generatePassword = () => {
    // Küçük harfler, büyük harfler, sayılar ve özel karakterler içeren bir karakter seti tanımlama
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';

    // Oluşturulan şifreyi saklamak için boş bir dize başlatın
    let newPassword = '';

    //For döngüsü boyunca yinelenerek belirtilen uzunlukta bir parola oluşturma
    for (let i = 0; i < 12; i++) {
        // Karakter seti uzunluğu dahilinde rastgele bir indeks oluşturma
        const randomIndex = Math.floor(Math.random() * charset.length);

        // Karakter setinden rastgele bir karakterin şifreye eklenmesi
        newPassword += charset[randomIndex];
    }

    // Oluşturulan şifreyi 'şifre' state değişkeninde ayarlama
    return newPassword;
};