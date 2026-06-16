using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace Business.Helpers
{
    public class PermissionHelpers
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public PermissionHelpers(IHostingEnvironment environment)
        {
            _hostingEnvironment = environment;
        }
        public string GetFilePath(IFormFile documentFile)
        {
            if (documentFile != null && documentFile.Length > 0)
            {
                string uniqueFileName = Guid.NewGuid().ToString() + "_" + documentFile.FileName;
                string filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "file-storage", "user-pdf-attachments", uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    documentFile.CopyTo(fileStream);
                }

                return filePath;
            }
            else
            {
                return "An error occured while saving pdf file";
            }
        }
    }
}
