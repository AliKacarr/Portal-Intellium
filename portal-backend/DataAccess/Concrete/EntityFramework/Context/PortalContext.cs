using Core.Utilities.Hashing;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System; // AppContext için

namespace DataAccess.Concrete.EntityFramework.Context
{
    public class PortalContext : DbContext
    {
        // Parameterless constructor for migrations if needed, or if configured elsewhere
        public PortalContext() { }

        // Constructor for Dependency Injection (if you configure DbContext in Startup.cs/Program.cs)
        public PortalContext(DbContextOptions<PortalContext> options) : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Only configure here if options are NOT already configured via DI
            if (!optionsBuilder.IsConfigured)
            {
                var builder = new ConfigurationBuilder().SetBasePath(Directory.GetCurrentDirectory()).AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
                var dbConnection = builder.Build().GetSection("ConnectionStrings:DevConnectionStrings").Value;

                AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
                AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);
                optionsBuilder.UseNpgsql(dbConnection);
            }
        }

        // --- DbSet'ler ---
        public DbSet<User> Users { get; set; }
        public DbSet<Agreement> Agreements { get; set; }
        public DbSet<UserAgreement> UserAgreements { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<OperationClaim> OperationClaims { get; set; }
        public DbSet<UserOperationClaim> UserOperationClaims { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<UserCustomer> UserCustomers { get; set; }
        public DbSet<MailParameters> MailParameters { get; set; }
        public DbSet<MailTemplates> MailTemplates { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectType> ProjectTypes { get; set; }
        public DbSet<ProjectTeam> ProjectTeams { get; set; }
        public DbSet<ProjectTeamMember> ProjectTeamMembers { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketComment> TicketComments { get; set; }
        public DbSet<TicketCommentReply> TicketCommentReplies { get; set; }
        public DbSet<TicketAttachment> TicketAttachments { get; set; }
        public DbSet<TicketEffort> TicketEfforts { get; set; }
        public DbSet<ForgotPassword> ForgotPasswords { get; set; }
        public DbSet<Board> Boards { get; set; }
        public DbSet<BoardMember> BoardMembers { get; set; }
        public DbSet<BoardCategory> BoardCategories { get; set; }
        public DbSet<AiTaskPreview> AiTaskPreviews { get; set; }
        public DbSet<CvUserImportBatch> CvUserImportBatches { get; set; }
        public DbSet<CvUserImportItem> CvUserImportItems { get; set; }
        public DbSet<Entities.Concrete.Task> Tasks { get; set; }
        public DbSet<TaskList> TaskLists { get; set; }
        public DbSet<TaskMember> TaskMembers { get; set; }
        public DbSet<TaskLabel> TaskLabels { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<TaskAttachment> TaskAttachments { get; set; }
        public DbSet<TaskTodoList> TaskTodoLists { get; set; }
        public DbSet<TaskTodo> TaskTodos { get; set; }
        public DbSet<Label> Labels { get; set; }
        public DbSet<Debit> Debits { get; set; }
        public DbSet<DebitRequest> DebitRequests { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<LeaveDeducation> LeaveDeducations { get; set; }
        public DbSet<Custom> Customs { get; set; }
        public DbSet<DaysWork> DaysWorks { get; set; }
        public DbSet<UserJobDetail> UserJobDetails { get; set; }
        public DbSet<UserJobExperience> UserJobExperiences { get; set; }
        public DbSet<UserProfileDetails> UserProfileDetails { get; set; }
        public DbSet<UserCertificateDetail> UserCertificateDetails { get; set; }
        public DbSet<UserEducationDetail> UserEducationDetails { get; set; }
        public DbSet<UserFamilyDetail> UserFamilyDetails { get; set; }
        public DbSet<UserLanguageDetail> UserLanguageDetails { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<RolesForUsers> RolesForUsers { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<ExpenseItem> ExpenseItems { get; set; }
        public DbSet<ExpenseIncompleteDraft> ExpenseIncompleteDrafts { get; set; }
        public DbSet<ExpenseDraftSnapshot> ExpenseDraftSnapshots { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ExpenseRequestReminderLog> ExpenseRequestReminderLogs { get; set; }
        public DbSet<Document> Documents { get; set; } // Bu genel Document mı? Yoksa HealthInfoDocument mı? Dikkat!
        public DbSet<HealthInfo> HealthInfos { get; set; }
        public DbSet<EmergencyContact> EmergencyContacts { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<NoteReminder> NoteReminders { get; set; }
        public DbSet<Folder> Folders { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<NoteTag> NoteTags { get; set; }
        public DbSet<NoteShare> NoteShares { get; set; }
        public DbSet<HealthInfoPremium> HealthInfoPremiums { get; set; }
        public DbSet<HealthInfoDependent> HealthInfoDependents { get; set; }
        public DbSet<HealthInfoDocument> HealthInfoDocuments { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<PermissionTypes> PermissionTypes { get; set; }
        public DbSet<ExpenseSettings> ExpenseSettings { get; set; }
        public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
        public DbSet<RequestCategory> RequestCategories { get; set; }
        public DbSet<RequestSubCategory> RequestSubCategories { get; set; }
        public DbSet<RequestSubCategoryField> RequestSubCategoryFields { get; set; }
        public DbSet<Request> Requests { get; set; }
        public DbSet<RequestStatusHistory> RequestStatusHistories { get; set; }
        public DbSet<RequestAttachment> RequestAttachments { get; set; }

        // --- Portal News / Announcement / Poll Modülleri ---
        public DbSet<Department> Departments { get; set; }
        public DbSet<NewsCategory> NewsCategories { get; set; }
        public DbSet<News> NewsItems { get; set; }
        public DbSet<NewsComment> NewsComments { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Poll> Polls { get; set; }
        public DbSet<PollQuestion> PollQuestions { get; set; }
        public DbSet<PollOption> PollOptions { get; set; }
        public DbSet<PollVote> PollVotes { get; set; }

        public DbSet<AnnouncementView> AnnouncementViews { get; set; }
        public DbSet<NewsView> NewsViews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // --- HealthInfo Entity Konfigürasyonu (Daha Açık Hal) ---
            modelBuilder.Entity<HealthInfo>(entity =>
            {
                // Primary Key'i tanımla (zaten yapıyordur ama garanti olsun)
                entity.HasKey(e => e.Id);

                // Foreign Key kolonunu açıkça belirt ve zorunlu yap
                entity.Property(e => e.UserId).IsRequired();

                // İlişkiyi tanımla: HealthInfo'nun BİR User'ı var...
                entity.HasOne(hi => hi.User)
                      // ...ve User'ın ÇOK HealthInfo'su var (User.cs'deki koleksiyonu kullanarak)
                      .WithMany(u => u.HealthInfos) // <-- User.cs'deki `public ICollection<HealthInfo> HealthInfos { get; set; }` buraya yazılır. Eğer User.cs'de bu koleksiyon YOKSA .WithMany() boş bırakılır.
                      // ...ve bu ilişkinin Foreign Key'i HealthInfo'daki 'UserId' kolonudur.
                      .HasForeignKey(hi => hi.UserId)
                      // User silindiğinde ilişkili HealthInfo kayıtları da silinsin.
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Diğer Entity Konfigürasyonları ---

            modelBuilder.Entity<Agreement>(entity =>
            {
                entity.ToTable("Agreements");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasConversion<int>().IsRequired();
                entity.Property(e => e.Content).HasColumnType("text").IsRequired();
                entity.Property(e => e.Version).IsRequired();
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnType("timestamp without time zone").IsRequired();
                entity.HasIndex(e => new { e.Type, e.IsActive });
                entity.HasIndex(e => new { e.Type, e.Version }).IsUnique();
            });

            modelBuilder.Entity<UserAgreement>(entity =>
            {
                entity.ToTable("UserAgreements");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.AgreementId).IsRequired();
                entity.Property(e => e.AcceptedAt).HasColumnType("timestamp without time zone").IsRequired();
                entity.HasIndex(e => new { e.UserId, e.AgreementId }).IsUnique();

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Agreement)
                    .WithMany()
                    .HasForeignKey(e => e.AgreementId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // HealthInfo - HealthInfoPremium (1:1)
            modelBuilder.Entity<HealthInfoPremium>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.HealthInfoId).IsRequired(); // FK zorunlu

                entity.HasOne(hip => hip.HealthInfo)
                      .WithOne(hi => hi.HealthInfoPremium) // HealthInfo'daki navigation property
                      .HasForeignKey<HealthInfoPremium>(hip => hip.HealthInfoId)
                      .OnDelete(DeleteBehavior.Cascade); // Ana kayıt silinince bu da silinsin

                // HealthInfoId UNIQUE olmalı (1:1 ilişki için)
                entity.HasIndex(hip => hip.HealthInfoId).IsUnique();
            });


            // HealthInfo - HealthInfoDependent (1:N)
            modelBuilder.Entity<HealthInfoDependent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.HealthInfoId).IsRequired(); // FK zorunlu

                entity.HasOne(hid => hid.HealthInfo) // Dependent'ın bir HealthInfo'su var
                      .WithMany(hi => hi.HealthInfoDependents) // HealthInfo'nun çok Dependent'ı var
                      .HasForeignKey(hid => hid.HealthInfoId) // FK
                      .OnDelete(DeleteBehavior.Cascade); // Ana kayıt silinince bu da silinsin
            });

            // HealthInfo - HealthInfoDocument (1:N)
            modelBuilder.Entity<HealthInfoDocument>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.HealthInfoId).IsRequired(); // FK zorunlu

                entity.HasOne(hido => hido.HealthInfo) // Document'ın bir HealthInfo'su var
                      .WithMany(hi => hi.HealthInfoDocuments) // HealthInfo'nun çok Document'ı var
                      .HasForeignKey(hido => hido.HealthInfoId) // FK
                      .OnDelete(DeleteBehavior.Cascade); // Ana kayıt silinince bu da silinsin
            });

            modelBuilder.Entity<Document>(entity =>
            {
                entity.Property(e => e.CreatedAt).HasColumnType("timestamp without time zone");
                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp without time zone");
                entity.Property(e => e.LastAccessed).HasColumnType("timestamp without time zone");
            });

            // --- DİĞER İLİŞKİLER ---

            // Permission → PermissionTypes (FK)
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasOne(p => p.PermissionTypeRef)
                      .WithMany(pt => pt.Permissions)
                      .HasForeignKey(p => p.PermissionTypeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Örneğin UserCustomer ilişkisi:
            modelBuilder.Entity<UserCustomer>(entity =>
            {
                 // Eğer UserCustomer'ın kendi Id'si varsa: entity.HasKey(uc => uc.Id);
                 // Veya kompozit anahtar varsa: entity.HasKey(uc => new { uc.UserId, uc.CustomerId });

                 entity.HasOne(uc => uc.User)
                       .WithMany() // User'da UserCustomers listesi yoksa
                       .HasForeignKey(uc => uc.UserId);

                 entity.HasOne(uc => uc.Customer)
                       .WithMany() // Customer'da UserCustomers listesi yoksa
                       .HasForeignKey(uc => uc.CustomerId);
            });

            // UserOperationClaim ilişkisi:
            modelBuilder.Entity<UserOperationClaim>(entity =>
            {
                entity.HasOne(uoc => uoc.User)
                      .WithMany()
                      .HasForeignKey(uoc => uoc.UserId);

                entity.HasOne(uoc => uoc.OperationClaim)
                      .WithMany()
                      .HasForeignKey(uoc => uoc.OperationClaimId);
            });

            modelBuilder.Entity<Expense>(entity =>
            {
                entity.Property(e => e.CurrencyCode).HasMaxLength(3).IsRequired();
            });

            modelBuilder.Entity<ExpenseIncompleteDraft>(entity =>
            {
                entity.ToTable("expense_incomplete_drafts");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Id).HasColumnName("id");
                entity.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                entity.Property(x => x.Status).HasColumnName("status").IsRequired();
                entity.Property(x => x.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb").IsRequired();
                entity.Property(x => x.PeriodEndAt).HasColumnName("period_end_at");
                entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
                entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
                entity.HasIndex(x => x.UserId);
                entity.HasIndex(x => x.PeriodEndAt);
            });

            modelBuilder.Entity<ExpenseDraftSnapshot>(entity =>
            {
                entity.ToTable("expense_drafts");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Id).HasColumnName("id");
                entity.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                entity.Property(x => x.Status).HasColumnName("status").IsRequired();
                entity.Property(x => x.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb").IsRequired();
                entity.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
                entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
                entity.HasIndex(x => x.UserId);
            });

            // Expense - ExpenseItem (1:N)
            modelBuilder.Entity<ExpenseItem>(entity =>
            {
                entity.HasKey(ei => ei.Id);
                entity.Property(ei => ei.ItemName).IsRequired().HasMaxLength(200);
                entity.Property(ei => ei.Quantity).IsRequired();
                entity.Property(ei => ei.UnitPrice).HasColumnType("numeric(18,2)");
                entity.Property(ei => ei.TotalAmount).HasColumnType("numeric(18,2)");
                entity.Property(ei => ei.IsKkeg).HasDefaultValue(false);
                entity.HasOne(ei => ei.Expense)
                      .WithMany(e => e.ExpenseItems)
                      .HasForeignKey(ei => ei.ExpenseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Talep Yönetimi tabloları (Request*)
            modelBuilder.Entity<RequestCategory>(entity =>
            {
                entity.ToTable("RequestCategories");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Name).IsRequired();
            });
            modelBuilder.Entity<RequestSubCategory>(entity =>
            {
                entity.ToTable("RequestSubCategories");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Name).IsRequired();
                entity.HasIndex(x => x.CategoryId);
            });
            modelBuilder.Entity<RequestSubCategoryField>(entity =>
            {
                entity.ToTable("RequestSubCategoryFields");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.FieldKey).IsRequired();
                entity.Property(x => x.Label).IsRequired();
                entity.Property(x => x.DataType).IsRequired();
                entity.HasIndex(x => x.SubCategoryId);
                entity.HasIndex(x => new { x.SubCategoryId, x.FieldKey }).IsUnique();
                entity.HasOne<RequestSubCategory>()
                    .WithMany()
                    .HasForeignKey(x => x.SubCategoryId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            modelBuilder.Entity<Request>(entity =>
            {
                entity.ToTable("Requests");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Title).IsRequired();
                entity.Property(x => x.Status)
                    .IsRequired()
                    .HasConversion(
                        v => TalepDurumuTurkish.ToTurkish(v),
                        v => TalepDurumuTurkish.ParseTurkishOrDefault(v, TalepDurumu.Taslak));
                entity.Property(x => x.AdminHighlightUserResubmit).HasDefaultValue(false);
                entity.Property(x => x.PayloadJson).HasColumnType("jsonb").IsRequired();
                entity.HasIndex(x => x.UserId);
                entity.HasIndex(x => x.Status);
                entity.HasIndex(x => x.CategoryId);
            });
            modelBuilder.Entity<RequestAttachment>(entity =>
            {
                entity.ToTable("RequestAttachments");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Name).IsRequired();
                entity.Property(x => x.AttachmentPath).IsRequired();
                entity.HasIndex(x => x.RequestId);
            });
            modelBuilder.Entity<RequestStatusHistory>(entity =>
            {
                entity.ToTable("RequestStatusHistories");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.FromStatus).IsRequired();
                entity.Property(x => x.ToStatus).IsRequired();
                entity.HasIndex(x => x.RequestId);
            });

            // MailParameters: SMTP girişi "User" — veritabanı kolonu legacy adı "Email"
            modelBuilder.Entity<MailParameters>(entity =>
            {
                entity.Property(e => e.User).HasColumnName("Email");
            });

            // --- Seed Data ---
            modelBuilder.Entity<UserRole>().HasData(
                new UserRole { Id = 1, RoleName = "admin", Description = "admin" },
                new UserRole { Id = 2, RoleName = "worker", Description = "worker" },
                new UserRole { Id = 3, RoleName = "user", Description = "user" },
                new UserRole { Id = 4, RoleName = "worker-outsource", Description = "worker-outsource" }
            );
            modelBuilder.Entity<OperationClaim>().HasData(
                new OperationClaim { Id = 1, Name = "admin" },
                new OperationClaim { Id = 2, Name = "worker" },
                new OperationClaim { Id = 3, Name = "user" },
                new OperationClaim { Id = 4, Name = "worker-outsource" }
            );

            modelBuilder.Entity<Customer>().HasData(new Customer
            {
                CustomerId = 1,
                CustomerName = "Intellium Bilişim Teknolojileri A.Ş.",
                CustomerShortName = "Intellium",
                Address = "Kirazlıdere, Dijitalpark Teknokent Çekmeköy Yerleşkesi, Ankara Cd İdari Bina A-1 Blok No:4A No:15, 34788 Çekmeköy/İstanbul",
                Country = "Türkiye",
                City = "İstanbul", 
                PostalCode = "34788",
                AuthorizedPersonFullName = "Turgut Özçelikyürek",
                AuthorizedPersonMail = "turgut.ozcelikyurek@intellium.com.tr",
                AuthorizedPersonTitle = "Ar-Ge Genel Müdür Yardımcısı",
                AuthorizedPersonPhone = "+90-216-388 40 33",
                BankName = "Türkiye Ekonomi Bankası",
                BankAccountNumber = "527261522815",
                Website = "intellium.com.tr",
                Phone = "+90-216-388 40 33",
                TaxDepartment = "Ümraniye Vergi Dairesi",
                TaxIdNumber = "527261522815",
                LicenceType = "Standart Lisans",
                LicenceKey = "J9W954ijk",
                LicenceStartDate = DateTime.Now,
                LicenceFinishDate = DateTime.Now.AddDays(60),
                AddetAt = DateTime.Now,
                IsActive = true,
            });

            HashingHelper.CreatePasswordHash("1234", out byte[] passwordHash, out byte[] passwordSalt);
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Language = "Türkçe",
                Email = "turgut.ozcelikyurek@intellium.com.tr",
                AddetAt = DateTime.Now,
                IsConfirm = true,
                MailConfirm = true,
                IsActive = true,
                MailConfirmDate = DateTime.Now,
                ConfirmValue = Guid.NewGuid().ToString(),
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                Name = "Turgut Özçelikyürek",
            });

            HashingHelper.CreatePasswordHash("123456", out byte[] passwordHash2, out byte[] passwordSalt2);
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 2,
                Language = "Türkçe",
                Email = "test.user@intellium.com.tr",
                AddetAt = DateTime.Now,
                IsConfirm = true,
                MailConfirm = true,
                IsActive = true,
                MailConfirmDate = DateTime.Now,
                ConfirmValue = Guid.NewGuid().ToString(),
                PasswordHash = passwordHash2,
                PasswordSalt = passwordSalt2,
                Name = "Test Kullanıcı",
            });

            // Seed: ikinci admin kullanıcı (lokal/dev için)
            // Not: HasData içinde DateTime/Guid dinamik üretimi migration scaffold anında sabitlenir.
            // Bu kullanıcı login testleri ve ilk kurulumlar için eklenmiştir.
            HashingHelper.CreatePasswordHash("Admin!12345", out byte[] passwordHash3, out byte[] passwordSalt3);
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 3,
                Language = "Türkçe",
                Email = "admin2@intellium.com.tr",
                AddetAt = new DateTime(2026, 5, 7, 0, 0, 0, DateTimeKind.Utc),
                IsConfirm = true,
                MailConfirm = true,
                IsActive = true,
                MailConfirmDate = new DateTime(2026, 5, 7, 0, 0, 0, DateTimeKind.Utc),
                ConfirmValue = "seed-admin2",
                PasswordHash = passwordHash3,
                PasswordSalt = passwordSalt3,
                Name = "Seed Admin 2",
            });

            // --- PermissionTypes Seed Data ---
            // DurationUnit: 1=gün, 2=saat
            modelBuilder.Entity<PermissionTypes>().HasData(
                new PermissionTypes { Id = 1, Permission = "Ücretli", SubPermission = "default", DurationUnit = 1, IsPaid = "Ücretli", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 2, Permission = "Ücretsiz", SubPermission = "default", DurationUnit = 1, IsPaid = "Ücretsiz", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 3, Permission = "Mazeret", SubPermission = "Evlilik İzni", DurationUnit = 1, MaxDuration = 3, MinDuration = 1, IsPaid = "Ücretli", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 4, Permission = "Mazeret", SubPermission = "Vefat İzni", DurationUnit = 1, MinDuration = 1, IsPaid = "Ücretli", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 5, Permission = "Mazeret", SubPermission = "Hastalık / Rapor-İş Göremezlik", DurationUnit = 1, MinDuration = 1, IsPaid = "SGK", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 6, Permission = "Mazeret", SubPermission = "Süt İzni", DurationUnit = 2, MaxDuration = 2, MinDuration = 0.5m, IsPaid = "Ücretli", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 7, Permission = "Mazeret", SubPermission = "Saatlik", DurationUnit = 2, MaxDuration = 8, MinDuration = 0.5m, IsPaid = "Ücretli", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false },
                new PermissionTypes { Id = 8, Permission = "Mazeret", SubPermission = "Doğum (Annelik)", DurationUnit = 1, MinDuration = 1, IsPaid = "SGK", LegalBasis = "4857 İş Kanunu", IsDeleteable = false, IsDivisible = false, IsPriority = false, RequiresDocument = false }
            );

            // --- Masraf Yönetimi Seed Data ---
            modelBuilder.Entity<ExpenseSettings>().HasData(new ExpenseSettings
            {
                Id = 1,
                MealAcceptedDailyAmount = 500,
                PreviousPeriodCutoffDay = 5,
                VatRatesJson = "[1,10,20]"
            });

            modelBuilder.Entity<ExpenseCategory>().HasData(
                new ExpenseCategory { Id = 1, Value = "Ulaşım", System = true, Visible = true, AliasesJson = "[]" },
                new ExpenseCategory { Id = 2, Value = "Yemek", System = true, Visible = true, AliasesJson = "[]" },
                new ExpenseCategory { Id = 3, Value = "Teknoloji", System = true, Visible = true, AliasesJson = "[]" },
                new ExpenseCategory { Id = 4, Value = "Telekom", System = true, Visible = true, AliasesJson = "[]" },
                new ExpenseCategory { Id = 5, Value = "Diğer", System = true, Visible = true, AliasesJson = "[]" }
            );

            modelBuilder.Entity<RolesForUsers>().HasData(new RolesForUsers { Id = 1, RoleId = 1, UserId = 1 });
            modelBuilder.Entity<RolesForUsers>().HasData(new RolesForUsers { Id = 2, RoleId = 2, UserId = 2 });
            modelBuilder.Entity<RolesForUsers>().HasData(new RolesForUsers { Id = 3, RoleId = 1, UserId = 3 });

            modelBuilder.Entity<UserOperationClaim>().HasData(new UserOperationClaim { Id = 1, UserId = 1, OperationClaimId = 1 });
            modelBuilder.Entity<UserOperationClaim>().HasData(new UserOperationClaim { Id = 2, UserId = 2, OperationClaimId = 2 });
            modelBuilder.Entity<UserOperationClaim>().HasData(new UserOperationClaim { Id = 3, UserId = 3, OperationClaimId = 1 });

            modelBuilder.Entity<UserCustomer>().HasData(new UserCustomer { Id = 1, CustomerId = 1, UserId = 1, IsActive = true, AddetAt = DateTime.Now });
            modelBuilder.Entity<UserCustomer>().HasData(new UserCustomer { Id = 2, CustomerId = 1, UserId = 2, IsActive = true, AddetAt = DateTime.Now });
            modelBuilder.Entity<UserCustomer>().HasData(new UserCustomer { Id = 3, CustomerId = 1, UserId = 3, IsActive = true, AddetAt = new DateTime(2026, 5, 7, 0, 0, 0, DateTimeKind.Utc) });

            modelBuilder.Entity<Note>(e => { e.ToTable("Notes"); e.HasKey(x => x.Id); });
            modelBuilder.Entity<Folder>(e => { e.ToTable("Folders"); e.HasKey(x => x.Id); });
            modelBuilder.Entity<Tag>(e => { e.ToTable("Tags"); e.HasKey(x => x.Id); });
            modelBuilder.Entity<NoteTag>(e => { e.ToTable("NoteTags"); e.HasKey(x => x.Id); });
            modelBuilder.Entity<NoteShare>(e => { e.ToTable("NoteShares"); e.HasKey(x => x.Id); });

            // --- Portal News Modülü ---

            // News → User (yazar silinemez)
            modelBuilder.Entity<News>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(n => n.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // News → Department (nullable, departman silinirse NULL)
            modelBuilder.Entity<News>()
                .HasOne<Department>()
                .WithMany()
                .HasForeignKey(n => n.DepartmentId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // News → NewsCategory (nullable)
            modelBuilder.Entity<News>()
                .HasOne<NewsCategory>()
                .WithMany()
                .HasForeignKey(n => n.NewsCategoryId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // NewsComment → News (cascade)
            modelBuilder.Entity<NewsComment>()
                .HasOne<News>()
                .WithMany()
                .HasForeignKey(c => c.NewsId)
                .OnDelete(DeleteBehavior.Cascade);

            // NewsComment → User
            modelBuilder.Entity<NewsComment>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // NewsComment → NewsComment (self-ref, nullable)
            modelBuilder.Entity<NewsComment>()
                .HasOne<NewsComment>()
                .WithMany()
                .HasForeignKey(c => c.ParentCommentId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // NewsView → News (cascade)
            modelBuilder.Entity<NewsView>()
                .HasOne(v => v.News)
                .WithMany()
                .HasForeignKey(v => v.NewsId)
                .OnDelete(DeleteBehavior.Cascade);

            // NewsView → User
            modelBuilder.Entity<NewsView>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // NewsView -> Unique (NewsId, UserId)
            modelBuilder.Entity<NewsView>()
                .HasIndex(v => new { v.NewsId, v.UserId })
                .IsUnique();

            // --- Announcement Modülü ---

            // Announcement → User (yazar silinemez)
            modelBuilder.Entity<Announcement>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Announcement → Department (nullable, departman silinirse NULL)
            modelBuilder.Entity<Announcement>()
                .HasOne<Department>()
                .WithMany()
                .HasForeignKey(a => a.DepartmentId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // AnnouncementView → Announcement (cascade)
            modelBuilder.Entity<AnnouncementView>()
                .HasOne(v => v.Announcement)
                .WithMany()
                .HasForeignKey(v => v.AnnouncementId)
                .OnDelete(DeleteBehavior.Cascade);

            // AnnouncementView → User
            modelBuilder.Entity<AnnouncementView>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // AnnouncementView -> Unique (AnnouncementId, UserId)
            modelBuilder.Entity<AnnouncementView>()
                .HasIndex(v => new { v.AnnouncementId, v.UserId })
                .IsUnique();

            // --- Poll Modülü ---

            // Poll → User
            modelBuilder.Entity<Poll>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(p => p.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Poll → Department (nullable)
            modelBuilder.Entity<Poll>()
                .HasOne<Department>()
                .WithMany()
                .HasForeignKey(p => p.DepartmentId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // PollQuestion → Poll (cascade)
            modelBuilder.Entity<PollQuestion>()
                .HasOne<Poll>()
                .WithMany()
                .HasForeignKey(q => q.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            // PollOption → PollQuestion (cascade)
            modelBuilder.Entity<PollOption>()
                .HasOne<PollQuestion>()
                .WithMany()
                .HasForeignKey(o => o.PollQuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            // PollVote → Poll (cascade)
            modelBuilder.Entity<PollVote>()
                .HasOne<Poll>()
                .WithMany()
                .HasForeignKey(v => v.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            // PollVote → PollQuestion
            modelBuilder.Entity<PollVote>()
                .HasOne<PollQuestion>()
                .WithMany()
                .HasForeignKey(v => v.PollQuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            // PollVote → PollOption
            modelBuilder.Entity<PollVote>()
                .HasOne<PollOption>()
                .WithMany()
                .HasForeignKey(v => v.PollOptionId)
                .OnDelete(DeleteBehavior.Restrict);

            // PollVote → User
            modelBuilder.Entity<PollVote>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Her kullanıcı bir soru için yalnızca bir kez oy verebilir
            modelBuilder.Entity<PollVote>()
                .HasIndex(v => new { v.PollQuestionId, v.UserId })
                .IsUnique();
        }
    }
}
