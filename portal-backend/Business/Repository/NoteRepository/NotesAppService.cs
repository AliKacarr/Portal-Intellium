using DataAccess.Repository.FolderRepository;
using DataAccess.Repository.NoteRepository;
using DataAccess.Repository.NoteTagRepository;
using DataAccess.Repository.TagRepository;
using DataAccess.Repository.NoteShareRepository;
using DataAccess.Repository.UserRepository;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.NoteDtos;
using Core.Identity;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Business.Repository.NoteRepository
{
    public class NotesAppService : INotesAppService
    {
        private readonly INoteDal _noteDal;
        private readonly INoteTagDal _noteTagDal;
        private readonly IFolderDal _folderDal;
        private readonly ITagDal _tagDal;
        private readonly INoteShareDal _noteShareDal;
        private readonly IUserDal _userDal;
        private readonly IUserContext _userContext;
        private readonly PortalContext _portalContext;

        public NotesAppService(
            INoteDal noteDal,
            INoteTagDal noteTagDal,
            IFolderDal folderDal,
            ITagDal tagDal,
            INoteShareDal noteShareDal,
            IUserDal userDal,
            IUserContext userContext,
            PortalContext portalContext)
        {
            _noteDal = noteDal;
            _noteTagDal = noteTagDal;
            _folderDal = folderDal;
            _tagDal = tagDal;
            _noteShareDal = noteShareDal;
            _userDal = userDal;
            _userContext = userContext;
            _portalContext = portalContext;
        }

        public List<NoteDto> GetNotesByUserId(long userId, string sortBy, string order)
        {
            // İstek: paylaşılan notlar /api/notes listesine karışmasın.
            // Paylaşılan notlar sadece /api/notes/shared ve /api/notes/shared-by-me üzerinden görüntülenir.
            var owned = _noteDal.GetAll(n => n.UserId == userId && !n.IsDeleted).ToList();
            return OrderAndMap(owned, sortBy, order);
        }

        public List<NoteDto> GetDeletedNotesByUserId(long userId, string sortBy, string order)
        {
            // Çöp kutusu: sadece kullanıcının sildiği notlar
            var deleted = _noteDal.GetAll(n => n.UserId == userId && n.IsDeleted).ToList();
            return OrderAndMap(deleted, sortBy, order);
        }

        public NoteDto SetPinned(Guid noteId, long userId, bool? isPinned)
        {
            // Sadece owner sabitleyebilsin (shared alıcılar için kapalı)
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId && !n.IsDeleted);
            if (note == null)
            {
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share != null) throw new UnauthorizedAccessException("Bu not size ait olmadığı için sabitleme kapalı.");
                return null;
            }

            var target = isPinned ?? !note.IsPinned;

            if (target && !note.IsPinned)
            {
                var pinnedCount = _noteDal.GetAll(n => n.UserId == userId && !n.IsDeleted && n.IsPinned).Count;
                if (pinnedCount >= 2)
                {
                    throw new InvalidOperationException("En fazla 2 not sabitleyebilirsiniz.");
                }
            }

            note.IsPinned = target;
            note.UpdatedAt = DateTime.UtcNow;
            _noteDal.Update(note);
            return MapToDto(note);
        }

        private List<NoteDto> OrderAndMap(List<Note> notes, string sortBy, string order)
        {
            var sort = (sortBy ?? "updatedAt").Trim().ToLowerInvariant();
            var ord = (order ?? "desc").Trim().ToLowerInvariant();
            var desc = ord != "asc";

            // HER ZAMAN: pinned notlar üstte.
            IOrderedEnumerable<Note> ordered = notes.OrderByDescending(n => n.IsPinned);

            switch (sort)
            {
                case "createdat":
                case "created":
                    ordered = desc
                        ? ordered.ThenByDescending(n => n.CreatedAt)
                        : ordered.ThenBy(n => n.CreatedAt);
                    break;

                case "updatedat":
                case "updated":
                    ordered = desc
                        ? ordered.ThenByDescending(n => n.UpdatedAt ?? n.CreatedAt)
                        : ordered.ThenBy(n => n.UpdatedAt ?? n.CreatedAt);
                    break;

                case "title":
                    ordered = desc
                        ? ordered.ThenByDescending(n => n.Title ?? "")
                        : ordered.ThenBy(n => n.Title ?? "");
                    break;

                case "contentlength":
                case "content_length":
                case "contentlen":
                    ordered = desc
                        ? ordered.ThenByDescending(GetContentLength)
                        : ordered.ThenBy(GetContentLength);
                    break;

                default:
                    // Varsayılan: updatedAt desc
                    ordered = ordered.ThenByDescending(n => n.UpdatedAt ?? n.CreatedAt);
                    break;
            }

            return ordered.Select(MapToDto).ToList();
        }

        private int GetContentLength(Note n)
        {
            if (!string.IsNullOrWhiteSpace(n.Content)) return StripHtml(n.Content).Length;
            return 0;
        }

        public NoteDto GetNoteById(Guid noteId, long userId)
        {
            // Önce sahiplik kontrolü
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note != null) return MapToDto(note);

            // Değilse paylaşılmış mı kontrol et
            var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
            if (share == null) return null;

            note = _noteDal.Get(n => n.Id == noteId && !n.IsDeleted);
            if (note == null) return null;

            var dto = MapToDto(note);
            var owner = _userDal.Get(u => u.Id == note.UserId);
            if (owner != null) dto.SharedBy = owner.Name;
            dto.ReadOnly = share.IsReadOnly;
            return dto;
        }

        public NoteDto CreateNote(long userId, NoteCreateUpdateDto dto)
        {
            var resolvedFolderId = ResolveFolderFromDto(dto);
            var note = new Note
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = dto.Title ?? "",
                FolderId = resolvedFolderId,
                Content = dto.Content ?? "",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                TaskId = dto.TaskId,
                IsFavorite = dto.IsFavorite ?? false,
                IsPinned = false,
                IsDeleted = dto.IsDeleted ?? false,
                IsPrivate = false,
                IsShared = false
            };
            _noteDal.Add(note);
            SyncNoteTags(note.Id, dto.TagIds);
            return MapToDto(note);
        }

        public NoteDto UpdateNote(Guid noteId, long userId, NoteCreateUpdateDto dto)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            NoteShare share = null;
            var isOwner = note != null;
            if (!isOwner)
            {
                share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share == null) return null;
                if (share.IsReadOnly) throw new UnauthorizedAccessException("Yaptığınız değişiklikler kaydolamayacaktır; bu not için düzenleme yetkiniz bulunmuyor.");
                note = _noteDal.Get(n => n.Id == noteId && !n.IsDeleted);
                if (note == null) return null;
            }

            // Owner: her alanı güncelleyebilir (mevcut davranış korunur).
            // Paylaşılan kullanıcı (readOnly=false): sadece Title + Content güncelleyebilir.
            if (dto.Title != null) note.Title = dto.Title;
            if (dto.Content != null)
            {
                note.Content = dto.Content;
            }

            if (isOwner)
            {
                var hasFolderUpdate = !string.IsNullOrEmpty(dto.FolderId) || (dto.FolderIds != null && dto.FolderIds.Count > 0);
                if (hasFolderUpdate) note.FolderId = ResolveFolderFromDto(dto);
                if (dto.IsFavorite.HasValue) note.IsFavorite = dto.IsFavorite.Value;
                if (dto.IsDeleted.HasValue) note.IsDeleted = dto.IsDeleted.Value;
                note.TaskId = dto.TaskId;
            }
            note.UpdatedAt = DateTime.UtcNow;
            _noteDal.Update(note);
            // Etiketler sadece owner tarafından güncellenebilir.
            if (isOwner && dto.TagIds != null) SyncNoteTags(noteId, dto.TagIds);
            var updatedDto = MapToDto(note);
            if (!isOwner)
            {
                updatedDto.ReadOnly = share?.IsReadOnly ?? false;
                var owner = _userDal.Get(u => u.Id == note.UserId);
                if (owner != null) updatedDto.SharedBy = owner.Name;
            }
            return updatedDto;
        }

        public void DeleteNote(Guid noteId, long userId)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note != null)
            {
                note.IsDeleted = true;
                note.UpdatedAt = DateTime.UtcNow;
                _noteDal.Update(note);
                return;
            }

            // Paylaşılan notu "sil" derse: notu yok etmeyiz, sadece o kullanıcı için paylaşımı kaldırırız.
            var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
            if (share != null) _noteShareDal.Delete(share);
        }

        public List<TagDto> GetAllTags(long userId)
        {
            var tags = _tagDal.GetAll(t => !t.IsDeleted && t.UserId == userId);
            return tags.Select(t => new TagDto { Id = t.Id.ToString(), Title = t.Title ?? "", ColorCode = string.IsNullOrWhiteSpace(t.ColorCode) ? "#6B7280" : t.ColorCode }).ToList();
        }

        public List<FolderDto> GetAllFolders(long userId)
        {
            // Frontend klasör kimliği olarak çoğunlukla "title" kullanıyor (örn. /folders/mehmet).
            // Aynı isimli tekrar kayıtlar oluşmuş olabiliyor; listeyi normalize edip tekilleştiriyoruz.
            var folders = _folderDal.GetAll(f => !f.IsDeleted);
            return folders
                .GroupBy(f => NormalizeKey(f.Title))
                .Select(g =>
                {
                    var canonical = g.OrderBy(f => f.Id).First();
                    var title = canonical.Title ?? "";
                    return new FolderDto { Id = string.IsNullOrWhiteSpace(title) ? canonical.Id.ToString() : title, Title = title };
                })
                .OrderBy(f => f.Title)
                .ToList();
        }

        public bool AddTagToNote(Guid noteId, long userId, string tagIdOrTitle)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note == null)
            {
                // Paylaşılan notlarda (alıcı kullanıcı) etiket ekleme kapalı
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share != null) throw new UnauthorizedAccessException("Bu not size ait olmadığı için etiket ekleme kapalı.");
                return false;
            }
            var tagId = ResolveOrCreateTagId(userId, tagIdOrTitle);
            if (tagId == null) return false;
            var exists = _noteTagDal.GetAll(nt => nt.NoteId == noteId && nt.TagId == tagId.Value).Any();
            if (exists) return true;
            _noteTagDal.Add(new NoteTag { Id = Guid.NewGuid(), NoteId = noteId, TagId = tagId.Value });
            return true;
        }

        public bool RemoveTagFromNote(Guid noteId, long userId, string tagIdOrTitle)
        {
            var tagId = ResolveTagId(userId, tagIdOrTitle);
            if (tagId == null) return false;
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note == null)
            {
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share != null) throw new UnauthorizedAccessException("Bu not size ait olmadığı için etiket çıkarma kapalı.");
                return false;
            }
            var existing = _noteTagDal.GetAll(nt => nt.NoteId == noteId && nt.TagId == tagId.Value).FirstOrDefault();
            if (existing == null) return true; // idempotent
            _noteTagDal.Delete(existing);
            return true;
        }

        public bool AssignFolderToNote(Guid noteId, long userId, string folderIdOrTitle)
        {
            if (string.IsNullOrWhiteSpace(folderIdOrTitle)) return false;

            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note == null)
            {
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share != null) throw new UnauthorizedAccessException("Bu not size ait olmadığı için klasöre taşıma kapalı.");
                return false;
            }

            Guid? folderId;
            var trimmed = folderIdOrTitle.Trim();
            if (Guid.TryParse(trimmed, out var guid))
            {
                // Guid gönderildiyse: sadece mevcutsa bağla, yoksa 404
                folderId = ResolveFolderId(trimmed, includeDeleted: false, undeleteIfFound: false, mergeDuplicates: false);
                if (folderId == null) return false;
            }
            else
            {
                // Title/slug gönderildiyse: yoksa oluştur; varsa (silinmişse) geri aç; duplicate varsa birleştir.
                var createdOrExisting = CreateFolder(trimmed);
                folderId = ResolveFolderId(createdOrExisting.Title, includeDeleted: true, undeleteIfFound: true, mergeDuplicates: true);
                if (folderId == null) return false;
            }
            note.FolderId = folderId.Value;
            note.UpdatedAt = DateTime.UtcNow;
            _noteDal.Update(note);
            return true;
        }

        public bool RemoveFolderFromNote(Guid noteId, long userId, string folderIdOrTitle)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note == null)
            {
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share != null) throw new UnauthorizedAccessException("Bu not size ait olmadığı için klasörden çıkarma kapalı.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(folderIdOrTitle)) return false;
            var trimmed = folderIdOrTitle.Trim();

            // Guid geldiyse doğrudan eşleştir
            if (Guid.TryParse(trimmed, out var g))
            {
                if (note.FolderId.HasValue && note.FolderId.Value == g)
                {
                    note.FolderId = null;
                    note.UpdatedAt = DateTime.UtcNow;
                    _noteDal.Update(note);
                }
                return true;
            }

            // Title/slug geldiyse: aynı key'e sahip tüm klasör id'lerini bul (duplicate toleransı)
            var key = NormalizeKey(trimmed);
            var matchedFolderIds = _folderDal.GetAll(f => NormalizeKey(f.Title) == key).Select(f => f.Id).ToHashSet();
            if (matchedFolderIds.Count == 0) return false;

            if (note.FolderId.HasValue && matchedFolderIds.Contains(note.FolderId.Value))
            {
                note.FolderId = null;
                note.UpdatedAt = DateTime.UtcNow;
                _noteDal.Update(note);
            }
            return true;
        }

        public bool ClearFolderFromNote(Guid noteId, long userId)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note == null)
            {
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share != null) throw new UnauthorizedAccessException("Bu not size ait olmadığı için klasörden çıkarma kapalı.");
                return false;
            }
            if (note.FolderId.HasValue)
            {
                note.FolderId = null;
                note.UpdatedAt = DateTime.UtcNow;
                _noteDal.Update(note);
            }
            return true;
        }

        public FolderDto CreateFolder(string title)
        {
            if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Klasör adı boş olamaz.", nameof(title));
            var trimmed = title.Trim();
            var existing = FindFolderByKey(trimmed, includeDeleted: true, mergeDuplicates: true);
            if (existing != null)
            {
                if (existing.IsDeleted)
                {
                    existing.IsDeleted = false;
                    _folderDal.Update(existing);
                }
                return new FolderDto
                {
                    Id = string.IsNullOrWhiteSpace(existing.Title) ? existing.Id.ToString() : existing.Title,
                    Title = existing.Title ?? trimmed
                };
            }

            var newFolder = new Folder
            {
                Id = Guid.NewGuid(),
                Title = trimmed,
                CreatedBy = _userContext.UserId,
                IsPrivate = false,
                IsFavorite = false,
                IsDeleted = false
            };
            _folderDal.Add(newFolder);
            var createdTitle = newFolder.Title ?? "";
            return new FolderDto { Id = string.IsNullOrWhiteSpace(createdTitle) ? newFolder.Id.ToString() : createdTitle, Title = createdTitle };
        }

        public bool DeleteFolder(string folderIdOrTitle, long userId)
        {
            if (string.IsNullOrWhiteSpace(folderIdOrTitle)) return false;
            var trimmed = folderIdOrTitle.Trim();

            // Guid geldiyse tek klasörü sil
            if (Guid.TryParse(trimmed, out var guid))
            {
                var folder = _folderDal.Get(f => f.Id == guid);
                if (folder == null) return true; // idempotent
                if (!folder.IsDeleted)
                {
                    folder.IsDeleted = true;
                    _folderDal.Update(folder);
                }
                NullNotesFolderAll(new[] { folder.Id });
                return true;
            }

            // Title/slug geldiyse aynı isimli tüm kopyaları birlikte sil (duplicate cleanup)
            var key = NormalizeKey(trimmed);
            var all = _folderDal.GetAll();
            var matched = all.Where(f => NormalizeKey(f.Title) == key).ToList();
            if (matched.Count == 0) return true; // idempotent
            foreach (var f in matched)
            {
                if (!f.IsDeleted)
                {
                    f.IsDeleted = true;
                    _folderDal.Update(f);
                }
            }
            NullNotesFolderAll(matched.Select(m => m.Id));
            return true;
        }

        public TagDto CreateTag(long userId, string title, string colorCode)
        {
            if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Etiket adı boş olamaz.", nameof(title));
            var trimmed = title.Trim();
            var exists = _tagDal.GetAll(t => !t.IsDeleted && t.UserId == userId)
                .Any(t => string.Equals(t.Title?.Trim(), trimmed, StringComparison.OrdinalIgnoreCase));
            if (exists) throw new InvalidOperationException("Aynı isimde etiket zaten mevcut.");
            var cc = NormalizeColorCodeOrNull(colorCode) ?? "#6B7280";
            var newTag = new Tag { Id = Guid.NewGuid(), UserId = userId, Title = trimmed, ColorCode = cc, IsDeleted = false };
            _tagDal.Add(newTag);
            return new TagDto { Id = newTag.Id.ToString(), Title = newTag.Title ?? "", ColorCode = newTag.ColorCode ?? "" };
        }

        public bool DeleteTag(string tagIdOrTitle, long userId)
        {
            return DeleteTagInternal(tagIdOrTitle, userId, permanent: false);
        }

        public bool PermanentDeleteTag(string tagIdOrTitle, long userId)
        {
            return DeleteTagInternal(tagIdOrTitle, userId, permanent: true);
        }

        private bool DeleteTagInternal(string tagIdOrTitle, long userId, bool permanent)
        {
            var tag = FindTag(userId, tagIdOrTitle, includeDeleted: true);
            if (tag == null) return false;

            // İlişkileri temizle (notlar üzerinde "ghost tag" kalmasın)
            var noteTags = _noteTagDal.GetAll(nt => nt.TagId == tag.Id);
            foreach (var nt in noteTags) _noteTagDal.Delete(nt);

            if (permanent)
            {
                _tagDal.Delete(tag);
                return true;
            }

            if (!tag.IsDeleted)
            {
                tag.IsDeleted = true;
                _tagDal.Update(tag);
            }
            return true;
        }

        /// <summary>Guid ise ilgili etiketin id'si; string ise başlığa göre bulur veya yoksa oluşturur.</summary>
        private Guid? ResolveOrCreateTagId(long userId, string tagIdOrTitle)
        {
            if (string.IsNullOrWhiteSpace(tagIdOrTitle)) return null;
            var trimmed = tagIdOrTitle.Trim();
            if (Guid.TryParse(trimmed, out var guid))
            {
                var tag = _tagDal.Get(t => t.Id == guid && t.UserId == userId && !t.IsDeleted);
                return tag?.Id;
            }
            var byTitle = _tagDal.GetAll(t => !t.IsDeleted && t.UserId == userId)
                .FirstOrDefault(t => string.Equals(t.Title?.Trim(), trimmed, StringComparison.OrdinalIgnoreCase));
            if (byTitle != null) return byTitle.Id;
            var newTag = new Tag { Id = Guid.NewGuid(), UserId = userId, Title = trimmed, ColorCode = "#6B7280", IsDeleted = false };
            _tagDal.Add(newTag);
            return newTag.Id;
        }

        private static string NormalizeColorCodeOrNull(string colorCode)
        {
            if (string.IsNullOrWhiteSpace(colorCode)) return null;
            var s = colorCode.Trim();
            // #RGB veya #RRGGBB destekle
            if (!s.StartsWith("#", StringComparison.Ordinal)) return null;
            if (s.Length != 4 && s.Length != 7) return null;
            for (var i = 1; i < s.Length; i++)
            {
                var c = s[i];
                var isHex =
                    (c >= '0' && c <= '9') ||
                    (c >= 'a' && c <= 'f') ||
                    (c >= 'A' && c <= 'F');
                if (!isHex) return null;
            }
            return s.ToUpperInvariant();
        }

        /// <summary>Guid ise id, string ise mevcut tag başlığından çözer (oluşturmaz).</summary>
        private Guid? ResolveTagId(long userId, string tagIdOrTitle)
        {
            if (string.IsNullOrWhiteSpace(tagIdOrTitle)) return null;
            var trimmed = tagIdOrTitle.Trim();
            if (Guid.TryParse(trimmed, out var guid))
            {
                var tag = _tagDal.Get(t => t.Id == guid && t.UserId == userId && !t.IsDeleted);
                return tag?.Id;
            }
            var byTitle = _tagDal.GetAll(t => !t.IsDeleted && t.UserId == userId)
                .FirstOrDefault(t => string.Equals(t.Title?.Trim(), trimmed, StringComparison.OrdinalIgnoreCase));
            return byTitle?.Id;
        }

        private Tag FindTag(long userId, string tagIdOrTitle, bool includeDeleted)
        {
            if (string.IsNullOrWhiteSpace(tagIdOrTitle)) return null;
            var trimmed = tagIdOrTitle.Trim();
            if (Guid.TryParse(trimmed, out var guid))
            {
                return includeDeleted
                    ? _tagDal.Get(t => t.Id == guid && t.UserId == userId)
                    : _tagDal.Get(t => t.Id == guid && t.UserId == userId && !t.IsDeleted);
            }
            return includeDeleted
                ? _tagDal.GetAll(t => t.UserId == userId).FirstOrDefault(t => string.Equals(t.Title?.Trim(), trimmed, StringComparison.OrdinalIgnoreCase))
                : _tagDal.GetAll(t => !t.IsDeleted && t.UserId == userId).FirstOrDefault(t => string.Equals(t.Title?.Trim(), trimmed, StringComparison.OrdinalIgnoreCase));
        }

        private Guid? ResolveFolderId(string folderIdOrTitle, bool includeDeleted, bool undeleteIfFound, bool mergeDuplicates)
        {
            var folder = FindFolder(folderIdOrTitle, includeDeleted, mergeDuplicates);
            if (folder == null) return null;
            if (undeleteIfFound && folder.IsDeleted)
            {
                folder.IsDeleted = false;
                _folderDal.Update(folder);
            }
            return folder.Id;
        }

        private Folder FindFolder(string folderIdOrTitle, bool includeDeleted, bool mergeDuplicates)
        {
            if (string.IsNullOrWhiteSpace(folderIdOrTitle)) return null;
            var trimmed = folderIdOrTitle.Trim();

            if (Guid.TryParse(trimmed, out var guid))
            {
                return includeDeleted
                    ? _folderDal.Get(f => f.Id == guid)
                    : _folderDal.Get(f => f.Id == guid && !f.IsDeleted);
            }

            return FindFolderByKey(trimmed, includeDeleted, mergeDuplicates);
        }

        private Folder FindFolderByKey(string folderTitleOrSlug, bool includeDeleted, bool mergeDuplicates)
        {
            var key = NormalizeKey(folderTitleOrSlug);
            var folders = includeDeleted ? _folderDal.GetAll() : _folderDal.GetAll(f => !f.IsDeleted);
            var matched = folders.Where(f => NormalizeKey(f.Title) == key).ToList();
            if (matched.Count == 0) return null;

            // Canonical seç: önce silinmemiş, sonra Id'ye göre
            var canonical = matched
                .OrderBy(f => f.IsDeleted ? 1 : 0)
                .ThenBy(f => f.Id)
                .First();

            if (mergeDuplicates && matched.Count > 1)
            {
                // Aynı isimli kopyaları birleştir: notları canonical'a taşı, diğer klasörleri silinmiş işaretle
                var duplicates = matched.Where(f => f.Id != canonical.Id).ToList();
                ReassignNotesFolderAll(duplicates.Select(d => d.Id), canonical.Id);
                foreach (var d in duplicates)
                {
                    if (!d.IsDeleted)
                    {
                        d.IsDeleted = true;
                        _folderDal.Update(d);
                    }
                }
            }

            // Klasör daha önce silindiyse CreateFolder/AssignFolderToNote bunu gerekirse açabilir
            return canonical;
        }

        private static string NormalizeKey(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return "";
            // Türkçe karakterleri bozmamak için tr-TR kültürüyle lowercase yapıyoruz.
            var s = input.Trim().ToLower(new System.Globalization.CultureInfo("tr-TR"));
            s = Regex.Replace(s, @"[\s\-_]+", " ");
            s = Regex.Replace(s, @"\s+", " ").Trim();
            return s;
        }

        private NoteDto MapToDto(Note n)
        {
            var noteTagIds = _noteTagDal.GetAll(nt => nt.NoteId == n.Id).Select(nt => nt.TagId).Distinct().ToList();
            var tagEntities = _tagDal.GetAll(t => noteTagIds.Contains(t.Id) && !t.IsDeleted).ToList();
            var tagsById = tagEntities.ToDictionary(t => t.Id, t => t);
            var tagIds = noteTagIds.Select(id => id.ToString()).ToList();
            var tags = noteTagIds
                .Where(id => tagsById.ContainsKey(id))
                .Select(id =>
                {
                    var t = tagsById[id];
                    return new TagDto
                    {
                        Id = t.Id.ToString(),
                        Title = t.Title ?? "",
                        ColorCode = string.IsNullOrWhiteSpace(t.ColorCode) ? "#6B7280" : t.ColorCode
                    };
                })
                .ToList();
            string folderPath = null;
            string folderTitle = null;
            if (n.FolderId.HasValue)
            {
                var folder = _folderDal.Get(f => f.Id == n.FolderId.Value);
                folderTitle = folder?.Title?.Trim();
                folderPath = folderTitle ?? "";
            }
            // Çoklu hatırlatıcılar (NoteReminders tablosu) — en yeni/gelecek sıraya göre dön.
            var reminderEntities = _portalContext.NoteReminders
                .Where(r => r.NoteId == n.Id && r.UserId == n.UserId)
                .OrderBy(r => r.ReminderAtUtc)
                .ToList();

            var reminders = reminderEntities
                .Select(r => new Entities.DTOs.NoteDtos.NoteReminderDto
                {
                    Id = r.Id.ToString(),
                    ReminderAt = DateTime.SpecifyKind(r.ReminderAtUtc, DateTimeKind.Utc).ToString("O"),
                    SentAt = r.SentAtUtc.HasValue ? DateTime.SpecifyKind(r.SentAtUtc.Value, DateTimeKind.Utc).ToString("O") : null
                })
                .ToList();

            return new NoteDto
            {
                Id = n.Id.ToString(),
                Title = n.Title ?? "",
                // Frontend "folderId" olarak çoğunlukla klasör adını kullanıyor (örn. /folders/mehmet).
                // Bu yüzden response'ta folderId/folderIds alanlarını title ile dolduruyoruz.
                FolderId = !string.IsNullOrWhiteSpace(folderTitle) ? folderTitle : n.FolderId?.ToString(),
                FolderIds = !string.IsNullOrWhiteSpace(folderTitle) ? new List<string> { folderTitle } : new List<string>(),
                FolderPath = folderPath ?? "",
                TagIds = tagIds,
                Tags = tags,
                UpdatedAt = (n.UpdatedAt ?? n.CreatedAt).ToString("O"),
                CreatedAt = n.CreatedAt.ToString("O"),
                Content = n.Content ?? "",
                TaskId = n.TaskId,
                IsFavorite = n.IsFavorite,
                IsPinned = n.IsPinned,
                IsDeleted = n.IsDeleted,
                // Backward compat: reminderAt alanı en yakın gelecekteki reminder (yoksa en son) olsun.
                ReminderAt = reminders.FirstOrDefault(r => r.SentAt == null)?.ReminderAt ?? reminders.LastOrDefault()?.ReminderAt,
                Reminders = reminders
            };
        }

        public NoteDto SetReminder(Guid noteId, long userId, DateTime? reminderAtUtc)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId && !n.IsDeleted);
            if (note == null)
                return null;

            if (reminderAtUtc.HasValue)
            {
                // Eski endpoint: yeni hatırlatıcı ekle (çoklu).
                AddReminder(noteId, userId, reminderAtUtc.Value);
            }
            else
            {
                // Eski endpoint: tüm hatırlatıcıları kaldır.
                var all = _portalContext.NoteReminders.Where(r => r.NoteId == noteId && r.UserId == userId).ToList();
                if (all.Count > 0)
                {
                    _portalContext.NoteReminders.RemoveRange(all);
                    _portalContext.SaveChanges();
                }
            }

            note.UpdatedAt = DateTime.UtcNow;
            _noteDal.Update(note);
            return MapToDto(note);
        }

        public NoteDto AddReminder(Guid noteId, long userId, DateTime reminderAtUtc)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId && !n.IsDeleted);
            if (note == null)
                return null;

            var incoming = DateTime.SpecifyKind(reminderAtUtc, DateTimeKind.Utc);
            if (incoming <= DateTime.UtcNow)
                throw new ArgumentException("Geçmiş bir tarih/saat seçilemez.");

            // Aynı dakika içinde (gg.aa.yyyy HH:mm) sadece 1 hatırlatıcı olsun.
            // Saniye/milisaniye farkı olsa bile aynı dakika çakışma kabul edilir.
            var incomingMinute = new DateTime(
                incoming.Year,
                incoming.Month,
                incoming.Day,
                incoming.Hour,
                incoming.Minute,
                0,
                DateTimeKind.Utc);
            var incomingMinuteEnd = incomingMinute.AddMinutes(1);

            var exists = _portalContext.NoteReminders.Any(r =>
                r.NoteId == noteId &&
                r.UserId == userId &&
                r.ReminderAtUtc >= incomingMinute &&
                r.ReminderAtUtc < incomingMinuteEnd);
            if (exists)
                throw new ArgumentException("Bu tarih/saatte zaten bir hatırlatıcı var.");

            _portalContext.NoteReminders.Add(new Entities.Concrete.NoteReminder
            {
                Id = Guid.NewGuid(),
                NoteId = noteId,
                UserId = userId,
                ReminderAtUtc = incomingMinute,
                SentAtUtc = null,
                CreatedAtUtc = DateTime.UtcNow
            });
            _portalContext.SaveChanges();

            note.UpdatedAt = DateTime.UtcNow;
            _noteDal.Update(note);
            return MapToDto(note);
        }

        public bool DeleteReminder(Guid noteId, Guid reminderId, long userId)
        {
            var reminder = _portalContext.NoteReminders.FirstOrDefault(r => r.Id == reminderId && r.NoteId == noteId && r.UserId == userId);
            if (reminder == null) return false;
            _portalContext.NoteReminders.Remove(reminder);
            _portalContext.SaveChanges();
            return true;
        }

        public bool PermanentDeleteNote(Guid noteId, long userId)
        {
            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == userId);
            if (note == null)
            {
                // Paylaşılan notta permanent delete çağrısı gelirse: paylaşımı kaldır (kullanıcının listesinden düşsün).
                var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == userId);
                if (share == null) return false;
                _noteShareDal.Delete(share);
                return true;
            }
            var noteTags = _noteTagDal.GetAll(nt => nt.NoteId == noteId);
            foreach (var nt in noteTags) _noteTagDal.Delete(nt);
            _noteDal.Delete(note);
            return true;
        }

        private Guid? ResolveFolderFromDto(NoteCreateUpdateDto dto)
        {
            // Öncelik: folderId, sonra folderIds[0]
            var raw = !string.IsNullOrWhiteSpace(dto?.FolderId)
                ? dto.FolderId
                : (dto?.FolderIds != null && dto.FolderIds.Count > 0 ? dto.FolderIds[0] : null);

            if (string.IsNullOrWhiteSpace(raw)) return null;

            // Guid ise ve DB'de yoksa 404 için null döndür.
            if (Guid.TryParse(raw.Trim(), out var g))
            {
                var folder = _folderDal.Get(f => f.Id == g && !f.IsDeleted);
                return folder?.Id;
            }

            // Guid değilse title/slug olarak çöz; YOKSA OLUŞTURMA (PUT sırasında yeni klasör oluşmasın)
            // Silinmiş klasörü de otomatik geri açma: kullanıcı silmiş olabilir.
            return ResolveFolderId(raw, includeDeleted: false, undeleteIfFound: false, mergeDuplicates: true);
        }

        private void NullNotesFolderAll(IEnumerable<Guid> folderIds)
        {
            var set = new HashSet<Guid>(folderIds);
            var notes = _noteDal.GetAll(n => n.FolderId.HasValue && set.Contains(n.FolderId.Value));
            foreach (var note in notes)
            {
                note.FolderId = null;
                note.UpdatedAt = DateTime.UtcNow;
                _noteDal.Update(note);
            }
        }

        private void ReassignNotesFolderAll(IEnumerable<Guid> fromFolderIds, Guid toFolderId)
        {
            var set = new HashSet<Guid>(fromFolderIds);
            var notes = _noteDal.GetAll(n => n.FolderId.HasValue && set.Contains(n.FolderId.Value));
            foreach (var note in notes)
            {
                note.FolderId = toFolderId;
                note.UpdatedAt = DateTime.UtcNow;
                _noteDal.Update(note);
            }
        }

        private void SyncNoteTags(Guid noteId, List<string> tagIds)
        {
            var existing = _noteTagDal.GetAll(nt => nt.NoteId == noteId);
            foreach (var nt in existing) _noteTagDal.Delete(nt);
            if (tagIds == null) return;
            foreach (var idStr in tagIds)
            {
                if (!Guid.TryParse(idStr, out var tagId)) continue;
                _noteTagDal.Add(new NoteTag { Id = Guid.NewGuid(), NoteId = noteId, TagId = tagId });
            }
        }

        public bool ShareNote(Guid noteId, long ownerId, NoteShareDto dto)
        {
            if (dto == null) throw new ArgumentException("Body boş olamaz.");
            if (dto.UserId <= 0) throw new ArgumentException("userId zorunludur.");
            if (dto.UserId == ownerId) throw new ArgumentException("Notu kendinizle paylaşamazsınız.");

            var note = _noteDal.Get(n => n.Id == noteId && n.UserId == ownerId);
            if (note == null)
            {
                return false;
            }

            var targetUser = _userDal.Get(u => u.Id == dto.UserId);
            if (targetUser == null) throw new KeyNotFoundException("Paylaşılacak kullanıcı bulunamadı.");

            var existing = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == dto.UserId);
            if (existing != null)
            {
                existing.IsReadOnly = dto.IsReadOnly;
                existing.SharedAt = DateTime.UtcNow;
                _noteShareDal.Update(existing);
            }
            else
            {
                _noteShareDal.Add(new NoteShare
                {
                    Id = Guid.NewGuid(),
                    NoteId = noteId,
                    UserId = dto.UserId,
                    IsReadOnly = dto.IsReadOnly,
                    SharedAt = DateTime.UtcNow
                });
            }
            return true;
        }

        public bool UnshareNote(Guid noteId, long ownerId, long targetUserId)
        {
            var note = _noteDal.Get(n => n.Id == noteId);
            if (note == null) return false;
            if (note.UserId != ownerId) throw new UnauthorizedAccessException("Bu notun paylaşım yetkisi sizde değil.");

            var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == targetUserId);
            if (share == null) return true;
            _noteShareDal.Delete(share);
            return true;
        }

        public List<NoteShareInfoDto> GetNoteShares(Guid noteId, long ownerId)
        {
            var note = _noteDal.Get(n => n.Id == noteId);
            if (note == null) return null;
            if (note.UserId != ownerId) throw new UnauthorizedAccessException("Bu notun paylaşım yetkisi sizde değil.");

            var shares = _noteShareDal.GetAll(ns => ns.NoteId == noteId).ToList();
            if (shares.Count == 0) return new List<NoteShareInfoDto>();

            var users = _userDal.GetAll().ToDictionary(u => u.Id, u => u);

            return shares
                .OrderByDescending(s => s.SharedAt)
                .Select(s =>
                {
                    users.TryGetValue(s.UserId, out var u);
                    return new NoteShareInfoDto
                    {
                        UserId = s.UserId,
                        UserName = u?.Name ?? "",
                        Email = u?.Email ?? "",
                        ReadOnly = s.IsReadOnly,
                        SharedAt = s.SharedAt
                    };
                })
                .ToList();
        }

        public bool UpdateNoteShare(Guid noteId, long ownerId, long targetUserId, bool readOnly)
        {
            var note = _noteDal.Get(n => n.Id == noteId);
            if (note == null) return false;
            if (note.UserId != ownerId) throw new UnauthorizedAccessException("Bu notun paylaşım yetkisi sizde değil.");

            var share = _noteShareDal.Get(ns => ns.NoteId == noteId && ns.UserId == targetUserId);
            if (share == null) return false;

            share.IsReadOnly = readOnly;
            share.SharedAt = DateTime.UtcNow;
            _noteShareDal.Update(share);
            return true;
        }

        public List<NoteDto> GetSharedNotes(long userId)
        {
            var shareInfos = _noteShareDal.GetAll(ns => ns.UserId == userId).ToList();
            var sharedIds = shareInfos.Select(ns => ns.NoteId).ToList();
            var notes = _noteDal.GetAll(n => sharedIds.Contains(n.Id) && !n.IsDeleted);

            var users = _userDal.GetAll(); // Normally better to get specific users, but this is a small system.

            return notes.Select(n => {
                var dto = MapToDto(n);
                var owner = users.FirstOrDefault(u => u.Id == n.UserId);
                if (owner != null)
                {
                    dto.SharedBy = owner.Name;
                }
                var share = shareInfos.FirstOrDefault(si => si.NoteId == n.Id);
                dto.ReadOnly = share?.IsReadOnly ?? false;
                return dto;
            }).ToList();
        }

        public List<NoteDto> GetNotesSharedByMe(long ownerId)
        {
            try
            {
                var ownedNotes = _noteDal.GetAll(n => n.UserId == ownerId && !n.IsDeleted).ToList();
                if (ownedNotes.Count == 0) return new List<NoteDto>();

                var ownedIds = ownedNotes.Select(n => n.Id).ToList();
                var sharedIds = _noteShareDal.GetAll(ns => ownedIds.Contains(ns.NoteId))
                    .Select(ns => ns.NoteId)
                    .Distinct()
                    .ToHashSet();

                return ownedNotes
                    .Where(n => sharedIds.Contains(n.Id))
                    .Select(MapToDto)
                    .ToList();
            }
            catch
            {
                // NoteShares tablosu/bağlantısı yoksa vs.
                return new List<NoteDto>();
            }
        }

        private static Guid? ParseGuidOrNull(string s)
        {
            if (string.IsNullOrEmpty(s)) return null;
            return Guid.TryParse(s, out var g) ? g : (Guid?)null;
        }

        private static string StripHtml(string html)
        {
            if (string.IsNullOrEmpty(html)) return "";
            return Regex.Replace(html, "<[^>]+>", " ").Trim();
        }
    }
}
