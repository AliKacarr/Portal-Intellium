using Business.File;
using Entities.DTOs;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace WebApi.Controllers
{
    [Route("api/files")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private readonly IFileService _fileService;
        public FilesController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpGet("getfile")]
        public IActionResult GetFileAsBase64(string filePath)
        {
            var result = _fileService.GetFileAsBase64(filePath);
            
            return (result.Success) ? new JsonResult(new { Base64String = result.Data }) : NotFound("Dosya bulunamadı");
        }

        //[HttpPost("fillpdf")]
        //public IActionResult FillPdf([FromBody] FileDto formData)
        //{
            
        //    string pdfFilePath = "C:\\Users\\yesar\\OneDrive\\Masaüstü\\portal-intellium-backend\\WebApi\\file-storage\\task-attachments\\Zimmet_Tutanagi.f7dfebf5.pdf";

        //    PdfReader pdfReader = new PdfReader(pdfFilePath);

        //    using (FileStream filledPdfStream = new FileStream("filled_pdf.pdf", FileMode.Create))
        //    {
        //        PdfStamper pdfStamper = new PdfStamper(pdfReader, filledPdfStream);
        //        AcroFields pdfFormFields = pdfStamper.AcroFields;

        //        pdfFormFields.SetField("name", formData.Name);

        //        pdfStamper.FormFlattening = true;
        //        pdfStamper.Close();
        //    }

        //    byte[] filledPdfBytes = System.IO.File.ReadAllBytes("filled_pdf.pdf");
        //    return File(filledPdfBytes, "application/pdf", "filled_pdf.pdf");
        //}

        
    }
}
