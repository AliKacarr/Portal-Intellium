using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace Business.Extensions
{
    public static class FileServerExtensions
    {
        public static void MapFileServer(this IApplicationBuilder app, string route, string folderName)
        {
            var env = app.ApplicationServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
            var rootPath = env!.ContentRootPath;
            var path = Path.Combine(rootPath, $"file-storage/{folderName}");
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }

            app.Map(route, file =>
            {
                file.UseFileServer(new FileServerOptions
                {
                    FileProvider = new PhysicalFileProvider(path),
                    EnableDirectoryBrowsing = false
                });
            });
        }
    }
}
