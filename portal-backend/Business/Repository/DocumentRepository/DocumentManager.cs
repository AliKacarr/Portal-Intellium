using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.DocumentRepository;
using DataAccess.Repository.ExpenseRepository;
using DataAccess.Repository.UserCustomerRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using Entities.DTOs.DocumentDto;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Business.Repository.DocumentRepository
{
    public class DocumentManager : IDocumentService
    {

        private readonly IDocumentDal _documentDal;
        private readonly IUserDal _userDal;
        private readonly IUserCustomerDal _userCustomerDal;

        public DocumentManager(IDocumentDal documentDal, IUserDal userDal,
            IUserCustomerDal userCustomerDal 
            )
        {
            _documentDal = documentDal;
            _userDal = userDal;
            _userCustomerDal = userCustomerDal;

        }

        /// <summary>İstemci <c>FileReader.readAsDataURL</c> ile gönderir; MIME charset vb. olabilir — sadece ana tür kontrol edilir.</summary>
        private static readonly HashSet<string> AllowedDocumentMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            // Görseller
            "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp", "image/tiff",
            // PDF ve metin
            "application/pdf",
            "text/plain", "text/csv", "text/tab-separated-values", "text/rtf", "text/markdown",
            "application/rtf",
            // Microsoft Office
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            // OpenDocument
            "application/vnd.oasis.opendocument.text",
            "application/vnd.oasis.opendocument.spreadsheet",
            "application/vnd.oasis.opendocument.presentation",
        };

        private static bool IsAllowedDocumentMime(string rawMimeFromDataUrl)
        {
            if (string.IsNullOrWhiteSpace(rawMimeFromDataUrl)) return false;
            var main = rawMimeFromDataUrl.Split(';')[0].Trim();
            return AllowedDocumentMimeTypes.Contains(main);
        }

        /// <summary>Add ve Update; TipData aynı "data:tip;base64,..." formatında olmalı — dosya içeriği Base64 kısmından.</summary>
        private static bool TryGetBytesFromDocumentTipData(string tipData, out byte[] fileDataBytes, out string errorMessage)
        {
            fileDataBytes = Array.Empty<byte>();
            errorMessage = null;
            try
            {
                string base64Pattern = @"data:(?<type>.*?);base64,(?<data>.*)";
                var match = Regex.Match(tipData ?? string.Empty, base64Pattern);
                if (!match.Success)
                {
                    errorMessage = "Invalid Base64 format";
                    return false;
                }

                string fileType = match.Groups["type"].Value;
                string base64Data = match.Groups["data"].Value;

                if (IsAllowedDocumentMime(fileType))
                {
                    fileDataBytes = string.IsNullOrEmpty(base64Data)
                        ? Array.Empty<byte>()
                        : Convert.FromBase64String(base64Data);
                    return true;
                }

                if (string.Equals(fileType, "folder", StringComparison.OrdinalIgnoreCase))
                {
                    fileDataBytes = Encoding.UTF8.GetBytes(tipData);
                    return true;
                }

                errorMessage = "Unsupported file type";
                return false;
            }
            catch (FormatException)
            {
                errorMessage = "Invalid Base64 format for TipData";
                return false;
            }
        }

        public IResult Add(DocumentDto documentDto)
        {
            try
            {
                if (!TryGetBytesFromDocumentTipData(documentDto.TipData, out var fileDataBytes, out var parseError))
                {
                    return new ErrorResult(parseError);
                }

                var user = _userDal.Get(u => u.Id == documentDto.UserId);
                if (user == null)
                {
                    return new ErrorResult("User not found");
                }

                var userCustomer = _userCustomerDal.Get(uc => uc.UserId == documentDto.UserId && uc.IsActive);
                if (userCustomer == null)
                {
                    return new ErrorResult("UserCustomer relationship not found");
                }

                var document = new Document
                {
                    
                    UserId = userCustomer.UserId,
                    CustomerId = userCustomer.CustomerId,
                    Name = documentDto.Name,
                    Description = documentDto.Description,
                    Position = documentDto.Position,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    LastAccessed = DateTime.Now,
                    Action = "Created",
                    TipData = fileDataBytes,
                    IsActive = documentDto.IsActive,  
                    Color = documentDto.Color,
                    ShareWith = documentDto.ShareWith,
                    Privacy = documentDto.Privacy,
                    Type = documentDto.Type,
                    Path = documentDto.Path,
                    Parent = documentDto.Parent,
                };

                _documentDal.AddDocument(document);
                return new SuccessResult("Document added successfully");
            }
            catch (FormatException)
            {
                return new ErrorResult("Invalid Base64 format for TipData");
            }
            catch (Exception ex)
            {
                return new ErrorResult($"Error adding Document: {ex.Message}");
            }
        }



        public IResult Delete(int Id)
        {
            var document = _documentDal.GetById(Id);
            if (document == null)
            {
                return new ErrorResult("Document not found");
            }

            _documentDal.DeleteDocument(Id);
            return new SuccessResult("Document deleted successfully");
        }

        public IDataResult<List<Document>> GetAll()
        {
            var Documents = _documentDal.GetAll();
            var activeDocuments = Documents.Where(d => d.IsActive).ToList();
            return new SuccessDataResult<List<Document>>(activeDocuments, "Aktif belgeler başarıyla getirildi");
        }

        public IDataResult<List<Document>> GetAllByUserId(long userId)
        {
            var Documents = _documentDal.GetAllByUserId(userId);
            if (Documents != null && Documents.Count > 0)
            {
                var user = _userDal.Get(u => u.Id == userId);
                var name = user?.Name?.Trim();
                if (!string.IsNullOrWhiteSpace(name))
                {
                    foreach (var d in Documents)
                    {
                        d.UserName = name;
                    }
                }
            }
            return new SuccessDataResult<List<Document>>(Documents, "Documents retrieved successfully");
        }

        public IDataResult<Document> GetById(int Id)
        {
            var Document = _documentDal.GetById(Id);
            if (Document == null)
            {
                return new ErrorDataResult<Document>("Document not found");
            }
            var user = _userDal.Get(u => u.Id == Document.UserId);
            var name = user?.Name?.Trim();
            if (!string.IsNullOrWhiteSpace(name))
            {
                Document.UserName = name;
            }
            return new SuccessDataResult<Document>(Document, "Document retrieved successfully");
        }

        private static bool IsFolderDocumentType(string? type) =>
            string.Equals((type ?? "").Trim(), "folder", StringComparison.OrdinalIgnoreCase);

        private static bool IsFolderDocument(Document document)
        {
            if (IsFolderDocumentType(document.Type))
                return true;
            if (document.TipData == null || document.TipData.Length == 0)
                return false;
            try
            {
                var text = Encoding.UTF8.GetString(document.TipData);
                return text.Contains("data:folder", StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        public IResult Update(DocumentDto documentDto)
        {
            var document = _documentDal.GetById(documentDto.Id);

            if (document == null)
            {
                return new ErrorResult("Document not found");
            }

            // Controller token'a göre UserId'yi zaten set ediyor (user: kendi id; admin: hedef id)
            if (document.UserId != documentDto.UserId)
            {
                return new ErrorResult("You are not authorized to update this document");
            }

            var user = _userDal.Get(u => u.Id == documentDto.UserId);
            if (user == null)
            {
                return new ErrorResult("User not found");
            }

            // Rename/metadata update gibi işlemlerde TipData gelmeyebilir; bu durumda mevcut içeriği koru.
            // Ayrıca GetById/GetDocumentsByParent dönüşünde byte[] -> base64 string gelebilir (data: prefix yok).
            // Sadece açıkça data:...;base64,... formatında geldiyse parse edip güncelle.
            byte[]? newTipData = null;
            var tipRaw = documentDto.TipData;
            var hasNewTipData =
                !string.IsNullOrWhiteSpace(tipRaw) &&
                tipRaw.TrimStart().StartsWith("data:", StringComparison.OrdinalIgnoreCase);
            if (hasNewTipData)
            {
                if (!TryGetBytesFromDocumentTipData(tipRaw, out var parsed, out var tipParseError))
                {
                    return new ErrorResult(tipParseError);
                }
                newTipData = parsed;
            }

            document.CustomerId = documentDto.CustomerId;
            document.Name = documentDto.Name;
            document.Description = documentDto.Description;
            document.Position = documentDto.Position;
            document.UpdatedAt = DateTime.Now;
            document.LastAccessed = DateTime.Now;
            document.Action = "Updated";
            document.IsActive = documentDto.IsActive;
            document.CreatedAt = document.CreatedAt;
            if (newTipData != null)
                document.TipData = newTipData;
            document.Path = documentDto.Path;
            document.Parent = documentDto.Parent;
            document.Privacy = documentDto.Privacy;
            document.ShareWith = documentDto.ShareWith;
            document.Color = documentDto.Color;

            if (IsFolderDocument(document) || IsFolderDocumentType(documentDto.Type))
                document.Type = "folder";
            else if (!string.IsNullOrWhiteSpace(documentDto.Type))
                document.Type = documentDto.Type.Trim();

            _documentDal.UpdateDocument(document);
            return new SuccessResult("Document updated successfully");
        }
    }

}
