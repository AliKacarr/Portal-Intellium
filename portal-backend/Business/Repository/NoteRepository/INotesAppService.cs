using Entities.DTOs.NoteDtos;
using System;
using System.Collections.Generic;

namespace Business.Repository.NoteRepository
{
    public interface INotesAppService
    {
        List<NoteDto> GetNotesByUserId(long userId, string sortBy, string order);
        List<NoteDto> GetDeletedNotesByUserId(long userId, string sortBy, string order);
        NoteDto GetNoteById(Guid noteId, long userId);
        NoteDto CreateNote(long userId, NoteCreateUpdateDto dto);
        NoteDto UpdateNote(Guid noteId, long userId, NoteCreateUpdateDto dto);
        void DeleteNote(Guid noteId, long userId);
        /// <summary>Notu sabitler/sabiti kaldırır. isPinned=null ise toggle yapar.</summary>
        NoteDto SetPinned(Guid noteId, long userId, bool? isPinned);
        List<TagDto> GetAllTags(long userId);
        List<FolderDto> GetAllFolders(long userId);
        /// <summary>Nota etiket ekler. tagIdOrTitle: Guid string veya etiket adı; ad yoksa oluşturulur.</summary>
        bool AddTagToNote(Guid noteId, long userId, string tagIdOrTitle);
        /// <summary>Notadan etiketi kaldırır. tagIdOrTitle: Guid string veya etiket adı.</summary>
        bool RemoveTagFromNote(Guid noteId, long userId, string tagIdOrTitle);
        /// <summary>Notu bir klasöre atar/taşır. folderIdOrTitle: Guid string veya klasör adı.</summary>
        bool AssignFolderToNote(Guid noteId, long userId, string folderIdOrTitle);
        /// <summary>Notun klasör atamasını kaldırır (folderIdOrTitle eşleşiyorsa).</summary>
        bool RemoveFolderFromNote(Guid noteId, long userId, string folderIdOrTitle);
        /// <summary>Notu klasörsüz (root) yapar.</summary>
        bool ClearFolderFromNote(Guid noteId, long userId);
        /// <summary>Klasör oluşturur. Aynı isim varsa mevcut klasörü döndürür.</summary>
        FolderDto CreateFolder(string title);
        /// <summary>Klasörü siler (soft delete) ve bu klasördeki notları boşa alır.</summary>
        bool DeleteFolder(string folderIdOrTitle, long userId);
        /// <summary>Yeni etiket oluşturur (başlık user'a özel eşsiz olmalı).</summary>
        TagDto CreateTag(long userId, string title, string colorCode);
        /// <summary>Etiketi siler (soft delete) ve not-etiket ilişkilerini temizler.</summary>
        bool DeleteTag(string tagIdOrTitle, long userId);
        /// <summary>Etiketi kalıcı siler (hard delete) ve not-etiket ilişkilerini temizler.</summary>
        bool PermanentDeleteTag(string tagIdOrTitle, long userId);
        /// <summary>Notu kalıcı siler (hard delete).</summary>
        bool PermanentDeleteNote(Guid noteId, long userId);
        bool ShareNote(Guid noteId, long ownerId, NoteShareDto dto);
        bool UnshareNote(Guid noteId, long ownerId, long targetUserId);
        List<NoteDto> GetSharedNotes(long userId);
        List<NoteDto> GetNotesSharedByMe(long ownerId);
        List<NoteShareInfoDto> GetNoteShares(Guid noteId, long ownerId);
        bool UpdateNoteShare(Guid noteId, long ownerId, long targetUserId, bool readOnly);

        /// <summary>Not sahibinin hatırlatıcı zamanını ayarlar/kaldırır.</summary>
        NoteDto SetReminder(Guid noteId, long userId, DateTime? reminderAtUtc);

        /// <summary>Nota yeni hatırlatıcı ekler (çoklu).</summary>
        NoteDto AddReminder(Guid noteId, long userId, DateTime reminderAtUtc);

        /// <summary>Notun hatırlatıcısını siler.</summary>
        bool DeleteReminder(Guid noteId, Guid reminderId, long userId);
    }
}
