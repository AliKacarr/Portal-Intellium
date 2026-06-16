using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Core.Utilities.Hashing
{
    public class HashingHelper
    {
        //password hashleme
        public static void CreatePasswordHash(string password,out byte[] passwordHash,out byte[] passwordSalt)
        {
            using(var hmac=new System.Security.Cryptography.HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash=hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        public static bool VerifyPasswordHash(string password,byte[] passwordHash, byte[] passwordSalt)
        {
            if (string.IsNullOrEmpty(password)) return false;
            if (passwordHash == null || passwordSalt == null) return false;
            if (passwordHash.Length == 0 || passwordSalt.Length == 0) return false;

            using (var hmac=new System.Security.Cryptography.HMACSHA512(passwordSalt))//gönderilen password hashle
            {
                var computeHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));//gönderilen password ile hashlenen password kontrol et
                if (computeHash.Length != passwordHash.Length) return false;
                for (int i = 0; i < computeHash.Length; i++)
                {
                    if (computeHash[i] != passwordHash[i])
                    {
                        return false;
                    }
                }
            }
            return true;
        }
    }
}
