using Autofac;
using Autofac.Extensions.DependencyInjection;
using Business.DependencyResolves.AutoFac;
using Core.Utilities.Json;
using Business.Helpers;
using Business.ReceiptVision;
using Business.Extensions;
using Business.MessageBrokers.MassTransit.RabbitMQ.Extensions;
using Business.Workers; // 1. EKLENDİ: Worker namespace'i
using Core.Middlewares.ExceptionMiddleware;
using Core.Utilities.IoC;
using Core.Utilities.Security.JWT;
using DataAccess.Concrete.EntityFramework.Context;
using RequestCategoryEntity = Entities.Concrete.RequestCategory;
using RequestSubCategoryEntity = Entities.Concrete.RequestSubCategory;
using RequestSubCategoryFieldEntity = Entities.Concrete.RequestSubCategoryField;
using FluentValidation;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Quartz;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Polly;
using Polly.Extensions.Http;

// Projeyi, wwwroot klasörünü en baştan tanıyacak şekilde özel seçeneklerle oluşturuyoruz.
var options = new WebApplicationOptions
{
    Args = args,
    WebRootPath = "wwwroot"
};
var builder = WebApplication.CreateBuilder(options);
// Varsayılan host yalnızca Development ortamında user-secrets yükler. ASPNETCORE_ENVIRONMENT başka veya IDE
// ayarı farklıysa GroqReceiptVision:ApiKey okunmaz; secrets'ı her zaman bu derlemeye bağlı yükle (yerelde geçerli).
builder.Configuration.AddUserSecrets(Assembly.GetExecutingAssembly());
var configuredUrls = builder.Configuration["ASPNETCORE_URLS"] ?? builder.Configuration["urls"];
var hasHttpsEndpoint = !string.IsNullOrWhiteSpace(configuredUrls)
    && configuredUrls 
        .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Any(url => url.StartsWith("https://", StringComparison.OrdinalIgnoreCase));

builder.Services.AddControllers(o =>
    {
        o.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
    })
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        o.JsonSerializerOptions.Converters.Add(new FlexibleDateTimeConverter());
        o.JsonSerializerOptions.Converters.Add(new FlexibleNullableDateTimeConverter());
    });

// Groq vision (fiş OCR) — Polly: 429 + geçici HTTP hatalarında 3 yeniden deneme, 2 sn aralık
builder.Services.Configure<GroqReceiptVisionOptions>(builder.Configuration.GetSection(GroqReceiptVisionOptions.SectionName));
builder.Services.AddHttpClient(GroqReceiptVisionService.HttpClientName, (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>().GetSection(GroqReceiptVisionOptions.SectionName);
    var baseUrl = cfg["BaseUrl"] ?? "https://api.groq.com/openai/v1";
    client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
    var timeoutSec = int.TryParse(cfg["TimeoutSeconds"], out var t) ? t : 120;
    client.Timeout = TimeSpan.FromSeconds(timeoutSec);
})
.AddPolicyHandler(HttpPolicyExtensions
    .HandleTransientHttpError()
    .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
    .WaitAndRetryAsync(3, _ => TimeSpan.FromSeconds(2)));

builder.WebHost.ConfigureKestrel(o => { o.Limits.MaxRequestBodySize = 56 * 1024 * 1024; });

// AOP (SecuredOperation) ve servisler için HttpContext erişimi
builder.Services.AddHttpContextAccessor();

//AutoMapper
builder.Services.AddAutoMapper(Assembly.Load("Business"));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer",
        Description = "JWT Bearer token ile kimlik doğrulama",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Fluent Validation For DI
builder.Services.AddValidatorsFromAssembly(Assembly.Load("Business"));

// BackgroundService (worker) exception'ları uygulamayı düşürmesin (özellikle Ctrl+C ile kapanışta).
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

// Scheduled Tasks
builder.Services.AddPortalQuartz();
builder.Services.AddQuartzHostedService(options => options.WaitForJobsToComplete = true);

// 2. EKLENDİ: Tatil Otomasyonu İçin Worker Servis
builder.Services.AddHostedService<HolidayWorker>();
builder.Services.AddHostedService<Business.Workers.ExpenseReminderStartupSweep>();
builder.Services.AddHostedService<CvUserImportWorker>();
builder.Services.AddHostedService<Business.Workers.NoteReminderWorker>();

// Database context
var portalConnectionString = builder.Configuration.GetConnectionString("DevConnectionStrings");
var portalLogConnectionString = builder.Configuration.GetConnectionString("LogConnectionStrings");

if (string.IsNullOrWhiteSpace(portalConnectionString))
    throw new InvalidOperationException("ConnectionStrings:DevConnectionStrings appsettings içinde bulunamadı.");

if (string.IsNullOrWhiteSpace(portalLogConnectionString))
    throw new InvalidOperationException("ConnectionStrings:LogConnectionStrings appsettings içinde bulunamadı.");

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);

builder.Services.AddDbContext<PortalContext>(options => options.UseNpgsql(portalConnectionString));
builder.Services.AddDbContext<PortalLogContext>(options => options.UseNpgsql(portalLogConnectionString));

// RabbitMQ / MassTransit
// Development'ta RabbitMQ yoksa uygulama ayakta kalsın diye InMemory'e düşüyoruz.
var rabbitMqConnectionString = builder.Configuration.GetConnectionString("RabbitMQ");
var rabbitMqEnabled = builder.Configuration.GetValue<bool?>("RabbitMQ:Enabled")
    ?? !builder.Environment.IsDevelopment();

if (rabbitMqEnabled && !string.IsNullOrWhiteSpace(rabbitMqConnectionString))
{
    builder.Services.AddRabbitMQService(rabbitMqConnectionString);
}
else
{
    builder.Services.AddMassTransit(configurator =>
    {
        configurator.UsingInMemory((context, config) => { });
    });
}
// SMTP (IOptions) ve portal kök URL
builder.Services.Configure<Business.Configuration.SmtpSettings>(builder.Configuration.GetSection(Business.Configuration.SmtpSettings.SectionName));
builder.Services.Configure<Business.Configuration.PortalAppSettings>(builder.Configuration.GetSection(Business.Configuration.PortalAppSettings.SectionName));
builder.Services.AddSingleton<Business.Helpers.IPortalAppUrlProvider, Business.Helpers.PortalAppUrlProvider>();

//Autofac modülü
builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());
builder.Host.ConfigureContainer<ContainerBuilder>(builder => builder.RegisterModule(new AutoFacBusinessModule()));

//JWT
var tokenOptions = builder.Configuration.GetSection("Token").Get<TokenOptions>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidIssuer = tokenOptions.Issuer,
        ValidAudience = tokenOptions.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenOptions.SecurityKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Refresh/hydration sırasında bazı istekler kısa süre Authorization header'sız gelebiliyor.
    // Dev ortamında yardımcı olmak için token'ı query/cookie'den de okuyabil.
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (!string.IsNullOrWhiteSpace(context.Token))
                return Task.CompletedTask;

            // access_token query param (özellikle websocket / test senaryoları)
            var tokenFromQuery = context.Request.Query["access_token"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(tokenFromQuery))
            {
                context.Token = tokenFromQuery;
                return Task.CompletedTask;
            }

            // common cookie names
            var cookies = context.Request.Cookies;
            string? tokenFromCookie = null;
            if (cookies != null)
            {
                if (!string.IsNullOrWhiteSpace(cookies["accessToken"])) tokenFromCookie = cookies["accessToken"];
                else if (!string.IsNullOrWhiteSpace(cookies["token"])) tokenFromCookie = cookies["token"];
                else if (!string.IsNullOrWhiteSpace(cookies["jwt"])) tokenFromCookie = cookies["jwt"];
            }

            if (!string.IsNullOrWhiteSpace(tokenFromCookie))
            {
                context.Token = tokenFromCookie;
            }

            return Task.CompletedTask;
        }
    };
});

// Cache
builder.Services.AddMemoryCache();

var app = builder.Build();

bool? databaseHadUserTablesAtStartup = null;
try
{
    using var startupScope = app.Services.CreateScope();
    var startupDb = startupScope.ServiceProvider.GetRequiredService<PortalContext>();
    var startupLogger = startupScope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupDatabaseState");
    var startupConnectionString = startupDb.Database.GetConnectionString();
    if (!string.IsNullOrWhiteSpace(startupConnectionString))
    {
        await EnsurePostgresDatabaseExistsAsync(startupConnectionString, startupLogger);
    }

    databaseHadUserTablesAtStartup = await startupDb.Database
        .SqlQueryRaw<int>(
            "SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name NOT LIKE 'pg_%' AND table_name <> '__EFMigrationsHistory') THEN 1 ELSE 0 END AS \"Value\"")
        .SingleAsync() == 1;
}
catch
{
    // DB başlangıç durumunu okuyamazsak mevcut korumalı migration akışı çalışmaya devam eder.
}

// Fiş OCR (Groq): anahtar var mı — değer asla loglanmaz. Öncelik: GROQ_API_KEY → GroqReceiptVision__ApiKey → GroqReceiptVision:ApiKey
try
{
    var receiptLog = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("GroqReceiptVision");
    var keySet = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GROQ_API_KEY"))
                 || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GroqReceiptVision__ApiKey"))
                 || !string.IsNullOrWhiteSpace(app.Configuration["GroqReceiptVision:ApiKey"]);
    if (keySet)
        receiptLog.LogInformation("Groq API anahtarı yapılandırıldı; fiş otomatik okuma kullanılabilir.");
    else
        receiptLog.LogWarning(
            "Groq API anahtarı yok — receipt/extract RECEIPT_AI_NOT_CONFIGURED dönebilir. " +
            "Ortam değişkeni: GROQ_API_KEY veya GroqReceiptVision__ApiKey (Windows: setx GROQ_API_KEY \"gsk_...\" veya Sistem özellikleri). " +
            "Alternatif: WebApi klasöründe dotnet user-secrets set \"GroqReceiptVision:ApiKey\" \"gsk_...\"");
}
catch
{
    /* ignore */
}

// SMTP yoksa mail hiç çıkmaz (alıcı adresi doğru olsa bile); açılışta net uyarı.
try
{
    using (var mailCheckScope = app.Services.CreateScope())
    {
        var smtpProvider = mailCheckScope.ServiceProvider.GetRequiredService<ISmtpMailParametersProvider>();
        var mailLogger = mailCheckScope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Mail");
        var mp = smtpProvider.GetUsableParameters();
        if (mp == null)
        {
            var pwdSet = !string.IsNullOrWhiteSpace(app.Configuration["Smtp:Password"]);
            mailLogger.LogWarning(
                "E-posta devre dışı: kullanılabilir SMTP yok. appsettings içinde Smtp:Password boş; ortam değişkeni Smtp__Password veya komut: cd WebApi && dotnet user-secrets set \"Smtp:Password\" \"GMAIL_UYGULAMA_SIFRESI\" (normal Gmail şifresi çoğu zaman çalışmaz; Google hesap → Güvenlik → Uygulama şifresi). Smtp:Password ayarlı mı={PwdSet}.",
                pwdSet);
        }
        else
        {
            var source = mp.Id == 0 ? "config(Smtp:*)" : $"db(MailParameters Id={mp.Id}, CustomerId={mp.CustomerId})";
            mailLogger.LogInformation(
                "SMTP yapılandırması bulundu; masraf bildirimleri e-posta ile gönderilebilir. Source={Source}, Host={Host}, Port={Port}, SSL={Ssl}, User={User}",
                source, mp.SMTP, mp.Port, mp.SSL, mp.User);
        }
    }
}
catch
{
    // DB henüz yoksa veya DI hatası: ana akışı bozma
}

// Expenses tablosunda ExpensePeriod kolonu yoksa ekle (getFiltered/getAllByUserId 500 hatasını önler)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var portalContext = scope.ServiceProvider.GetRequiredService<PortalContext>();
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"ExpensePeriod\" text NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "UPDATE \"Expenses\" SET \"ExpensePeriod\" = to_char(\"InvoiceDate\", 'YYYY-MM') WHERE \"ExpensePeriod\" IS NULL;");
        // EF modeli zorunlu: kolon yoksa SELECT 500 döner (GetAllForAdmin / getFiltered)
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"CurrencyCode\" character varying(3) NOT NULL DEFAULT 'TRY';");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"IsPinned\" boolean NOT NULL DEFAULT false;");
        // Yemek + ulaşım ortak kişi sayısı: eski kolon adı MealPersonCount → PersonCount
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DO $$
            DECLARE
                seeded_count integer;
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Expenses' AND column_name = 'MealPersonCount'
              ) THEN
                ALTER TABLE ""Expenses"" RENAME COLUMN ""MealPersonCount"" TO ""PersonCount"";
              END IF;
            END $$;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"ImagePath\" text NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"RejectReason\" text NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"RevisionReason\" text NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"RequestId\" text NOT NULL DEFAULT '';");
        // Notification.ReferenceId: bigint -> text (requestId gibi string anahtarlar için)
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Notifications' AND column_name = 'ReferenceId'
              ) THEN
                ALTER TABLE ""Notifications"" ALTER COLUMN ""ReferenceId"" TYPE text USING ""ReferenceId""::text;
              END IF;
            END $$;");
        // Notifications.NavigationData: EF modelinde var, DB'de olmayabilir (migration uygulanmamışsa)
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Notifications\" ADD COLUMN IF NOT EXISTS \"NavigationData\" text;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"MailParameters\" ADD COLUMN IF NOT EXISTS \"FromEmail\" text NOT NULL DEFAULT '';");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"MailParameters\" ADD COLUMN IF NOT EXISTS \"FromName\" text NOT NULL DEFAULT '';");
        await portalContext.Database.ExecuteSqlRawAsync(
            @"UPDATE ""MailParameters"" SET ""FromEmail"" = BTRIM(""Email"") WHERE BTRIM(COALESCE(""FromEmail"", '')) = '';");
        await portalContext.Database.ExecuteSqlRawAsync(
            @"UPDATE ""MailParameters"" SET ""FromName"" = 'Portal Intellium' WHERE BTRIM(COALESCE(""FromName"", '')) = '';");
        await portalContext.Database.ExecuteSqlRawAsync(
            @"UPDATE ""UserRoles"" SET ""RoleName"" = 'worker-outsource', ""Description"" = 'worker-outsource' WHERE ""Id"" = 4;");
        // Request hatırlatma logu (idempotency)
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""ExpenseRequestReminderLogs"" (
                ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""RequestId"" text NOT NULL,
                ""ReminderType"" text NOT NULL,
                ""ScheduledForDate"" timestamp without time zone NOT NULL,
                ""SentAt"" timestamp without time zone NULL,
                ""Status"" text NOT NULL,
                ""Error"" text NULL
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE UNIQUE INDEX IF NOT EXISTS \"UX_ExpenseRequestReminderLogs_RequestId_Type_Date\" ON \"ExpenseRequestReminderLogs\"(\"RequestId\",\"ReminderType\",\"ScheduledForDate\");");
        // Eski kayitlarda requestId bos kalmis olabilir: UI gruplama icin doldur (en azindan stabil olsun)
        await portalContext.Database.ExecuteSqlRawAsync(
            "UPDATE \"Expenses\" SET \"RequestId\" = ('legacy-' || \"Id\"::text) WHERE \"RequestId\" IS NULL OR \"RequestId\" = '';");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"AcceptedDailyAmount\" numeric(18,2) NOT NULL DEFAULT 0;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"UncoveredAmount\" numeric(18,2) NOT NULL DEFAULT 0;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"ExtraCategorie\" text NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"IsKkeg\" boolean NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"ApprovedTotalAmount\" numeric(18,2) NULL;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"OriginalTotalAmount\" numeric(18,2) NOT NULL DEFAULT 0;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"HasKkeg\" boolean NOT NULL DEFAULT false;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "UPDATE \"Expenses\" SET \"OriginalTotalAmount\" = \"TotalAmount\" WHERE \"OriginalTotalAmount\" = 0;");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""ExpenseItems"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""ExpenseId"" integer NOT NULL,
                ""ItemName"" text NOT NULL,
                ""Quantity"" integer NOT NULL,
                ""UnitPrice"" numeric(18,2) NOT NULL,
                ""KdvRate"" integer NOT NULL,
                ""TotalAmount"" numeric(18,2) NOT NULL,
                ""IsKkeg"" boolean NOT NULL DEFAULT false,
                CONSTRAINT ""FK_ExpenseItems_Expenses_ExpenseId"" FOREIGN KEY (""ExpenseId"") REFERENCES ""Expenses""(""Id"") ON DELETE CASCADE
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(
            "ALTER TABLE \"ExpenseItems\" ADD COLUMN IF NOT EXISTS \"IsKkeg\" boolean NOT NULL DEFAULT false;");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_ExpenseItems_ExpenseId\" ON \"ExpenseItems\"(\"ExpenseId\");");

        // ExpenseSettings tablosu yoksa oluştur ve varsayılan kayıt ekle (GET 500 / Add "nesnesi mevcut değil" hatasını önler)
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""ExpenseSettings"" (
                ""Id"" integer NOT NULL PRIMARY KEY,
                ""MealAcceptedDailyAmount"" integer NOT NULL DEFAULT 500,
                ""PreviousPeriodCutoffDay"" integer NOT NULL DEFAULT 5,
                ""VatRatesJson"" text NOT NULL DEFAULT '[1,10,20]'
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            INSERT INTO ""ExpenseSettings"" (""Id"", ""MealAcceptedDailyAmount"", ""PreviousPeriodCutoffDay"", ""VatRatesJson"")
            VALUES (1, 500, 5, '[1,10,20]')
            ON CONFLICT (""Id"") DO NOTHING;
        ");

        // Tamamlanmamış masraf taslakları: bağımsız tablo (ham JSON snapshot)
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS expense_incomplete_drafts (
                id uuid PRIMARY KEY,
                user_id bigint NOT NULL,
                status text NOT NULL DEFAULT 'Tamamlanmamış',
                payload_json jsonb NOT NULL,
                period_end_at timestamp without time zone NULL,
                created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                updated_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                CONSTRAINT fk_expense_incomplete_drafts_users FOREIGN KEY (user_id) REFERENCES ""Users""(""Id"") ON DELETE CASCADE
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS ix_expense_incomplete_drafts_user_id ON expense_incomplete_drafts(user_id);");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS ix_expense_incomplete_drafts_period_end_at ON expense_incomplete_drafts(period_end_at);");

        // Taslak snapshot'ları (uuid) — frontend localStorage yerine kalıcı
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS expense_drafts (
                id uuid PRIMARY KEY,
                user_id bigint NOT NULL,
                status text NOT NULL DEFAULT 'Taslak',
                payload_json jsonb NOT NULL,
                created_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                updated_at timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                CONSTRAINT fk_expense_drafts_users FOREIGN KEY (user_id) REFERENCES ""Users""(""Id"") ON DELETE CASCADE
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS ix_expense_drafts_user_id ON expense_drafts(user_id);");

        // --- Talep Yönetimi (Request*) ---
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""RequestCategories"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""Name"" text NOT NULL,
                ""SortOrder"" integer NOT NULL DEFAULT 0,
                ""IsActive"" boolean NOT NULL DEFAULT true
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""RequestSubCategories"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""CategoryId"" integer NOT NULL,
                ""Name"" text NOT NULL,
                ""IsOther"" boolean NOT NULL DEFAULT false,
                ""SortOrder"" integer NOT NULL DEFAULT 0,
                ""IsActive"" boolean NOT NULL DEFAULT true,
                CONSTRAINT ""FK_RequestSubCategories_RequestCategories_CategoryId"" FOREIGN KEY (""CategoryId"") REFERENCES ""RequestCategories""(""Id"") ON DELETE CASCADE
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""RequestCategories""
              ADD COLUMN IF NOT EXISTS ""SortOrder"" integer NOT NULL DEFAULT 0,
              ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;

            ALTER TABLE ""RequestSubCategories""
              ADD COLUMN IF NOT EXISTS ""CategoryId"" integer NOT NULL DEFAULT 0,
              ADD COLUMN IF NOT EXISTS ""IsOther"" boolean NOT NULL DEFAULT false,
              ADD COLUMN IF NOT EXISTS ""SortOrder"" integer NOT NULL DEFAULT 0,
              ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DO $$
            DECLARE
                seq_name text;
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_attribute a
                    JOIN pg_class c ON c.oid = a.attrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                    WHERE n.nspname = 'public'
                      AND c.relname = 'RequestCategories'
                      AND a.attname = 'Id'
                      AND a.attidentity = ''
                      AND d.oid IS NULL
                ) THEN
                    ALTER TABLE ""RequestCategories"" ALTER COLUMN ""Id"" ADD GENERATED BY DEFAULT AS IDENTITY;
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM pg_attribute a
                    JOIN pg_class c ON c.oid = a.attrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                    WHERE n.nspname = 'public'
                      AND c.relname = 'RequestSubCategories'
                      AND a.attname = 'Id'
                      AND a.attidentity = ''
                      AND d.oid IS NULL
                ) THEN
                    ALTER TABLE ""RequestSubCategories"" ALTER COLUMN ""Id"" ADD GENERATED BY DEFAULT AS IDENTITY;
                END IF;

                seq_name := pg_get_serial_sequence('""RequestCategories""', 'Id');
                IF seq_name IS NOT NULL THEN
                    EXECUTE format(
                        'SELECT setval(%L, GREATEST((SELECT COALESCE(MAX(""Id""), 0) FROM ""RequestCategories""), 1), true)',
                        seq_name
                    );
                END IF;

                seq_name := pg_get_serial_sequence('""RequestSubCategories""', 'Id');
                IF seq_name IS NOT NULL THEN
                    EXECUTE format(
                        'SELECT setval(%L, GREATEST((SELECT COALESCE(MAX(""Id""), 0) FROM ""RequestSubCategories""), 1), true)',
                        seq_name
                    );
                END IF;
            END $$;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""RequestSubCategoryFields"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""SubCategoryId"" integer NOT NULL,
                ""FieldKey"" text NOT NULL,
                ""Label"" text NOT NULL,
                ""DataType"" text NOT NULL,
                ""IsRequired"" boolean NOT NULL DEFAULT false,
                ""SortOrder"" integer NOT NULL DEFAULT 0,
                ""IsActive"" boolean NOT NULL DEFAULT true,
                CONSTRAINT ""FK_RequestSubCategoryFields_RequestSubCategories_SubCategoryId"" FOREIGN KEY (""SubCategoryId"") REFERENCES ""RequestSubCategories""(""Id"") ON DELETE CASCADE
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""RequestSubCategoryFields""
              ADD COLUMN IF NOT EXISTS ""SubCategoryId"" integer NOT NULL DEFAULT 0,
              ADD COLUMN IF NOT EXISTS ""FieldKey"" text NOT NULL DEFAULT '',
              ADD COLUMN IF NOT EXISTS ""Label"" text NOT NULL DEFAULT '',
              ADD COLUMN IF NOT EXISTS ""DataType"" text NOT NULL DEFAULT 'text',
              ADD COLUMN IF NOT EXISTS ""IsRequired"" boolean NOT NULL DEFAULT false,
              ADD COLUMN IF NOT EXISTS ""SortOrder"" integer NOT NULL DEFAULT 0,
              ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DO $$
            DECLARE
                seq_name text;
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_attribute a
                    JOIN pg_class c ON c.oid = a.attrelid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                    WHERE n.nspname = 'public'
                      AND c.relname = 'RequestSubCategoryFields'
                      AND a.attname = 'Id'
                      AND a.attidentity = ''
                      AND d.oid IS NULL
                ) THEN
                    ALTER TABLE ""RequestSubCategoryFields"" ALTER COLUMN ""Id"" ADD GENERATED BY DEFAULT AS IDENTITY;
                END IF;

                seq_name := pg_get_serial_sequence('""RequestSubCategoryFields""', 'Id');
                IF seq_name IS NOT NULL THEN
                    EXECUTE format(
                        'SELECT setval(%L, GREATEST((SELECT COALESCE(MAX(""Id""), 0) FROM ""RequestSubCategoryFields""), 1), true)',
                        seq_name
                    );
                END IF;
            END $$;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Requests"" (
                ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""UserId"" bigint NOT NULL,
                ""CategoryId"" integer NOT NULL,
                ""SubCategoryId"" integer NOT NULL DEFAULT 0,
                ""OtherText"" text NULL,
                ""Title"" text NOT NULL,
                ""Description"" text NULL,
                ""PayloadJson"" jsonb NOT NULL DEFAULT '{{}}'::jsonb,
                ""Status"" text NOT NULL,
                ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                ""UpdatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                ""AssignedToUserId"" bigint NULL,
                ""LastActionByUserId"" bigint NULL,
                ""LastActionNote"" text NULL,
                CONSTRAINT ""FK_Requests_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_Requests_RequestCategories_CategoryId"" FOREIGN KEY (""CategoryId"") REFERENCES ""RequestCategories""(""Id"") ON DELETE RESTRICT,
                -- SubCategoryId NOT NULL olduğu için SET NULL geçersiz; silmeye karşı koru.
                CONSTRAINT ""FK_Requests_RequestSubCategories_SubCategoryId"" FOREIGN KEY (""SubCategoryId"") REFERENCES ""RequestSubCategories""(""Id"") ON DELETE RESTRICT
            );
        ");

        // NOT: Table daha önce oluşturulduysa CREATE TABLE IF NOT EXISTS kolon eklemez.
        // Bu yüzden eksik kolonları idempotent şekilde tamamlıyoruz (özellikle PayloadJson).
        await portalContext.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Requests""
              ADD COLUMN IF NOT EXISTS ""PayloadJson"" jsonb NOT NULL DEFAULT '{{}}'::jsonb;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Requests""
              ADD COLUMN IF NOT EXISTS ""OtherText"" text NULL,
              ADD COLUMN IF NOT EXISTS ""AssignedToUserId"" bigint NULL,
              ADD COLUMN IF NOT EXISTS ""LastActionByUserId"" bigint NULL,
              ADD COLUMN IF NOT EXISTS ""LastActionNote"" text NULL;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Requests""
              ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
              ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc');
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Requests""
              ADD COLUMN IF NOT EXISTS ""AdminHighlightUserResubmit"" boolean NOT NULL DEFAULT false;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""RequestAttachments"" (
                ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""RequestId"" bigint NOT NULL,
                ""CreatorUserId"" bigint NOT NULL,
                ""Name"" text NOT NULL,
                ""AttachmentPath"" text NOT NULL,
                ""ContentType"" text NULL,
                ""SizeBytes"" bigint NOT NULL DEFAULT 0,
                CONSTRAINT ""FK_RequestAttachments_Requests_RequestId"" FOREIGN KEY (""RequestId"") REFERENCES ""Requests""(""Id"") ON DELETE CASCADE
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""RequestStatusHistories"" (
                ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""RequestId"" bigint NOT NULL,
                ""FromStatus"" text NOT NULL,
                ""ToStatus"" text NOT NULL,
                ""ActionByUserId"" bigint NOT NULL,
                ""Note"" text NULL,
                ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                CONSTRAINT ""FK_RequestStatusHistories_Requests_RequestId"" FOREIGN KEY (""RequestId"") REFERENCES ""Requests""(""Id"") ON DELETE CASCADE,
                CONSTRAINT ""FK_RequestStatusHistories_Users_ActionByUserId"" FOREIGN KEY (""ActionByUserId"") REFERENCES ""Users""(""Id"") ON DELETE RESTRICT
            );
        ");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_Requests_UserId\" ON \"Requests\"(\"UserId\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_Requests_Status\" ON \"Requests\"(\"Status\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_Requests_CategoryId\" ON \"Requests\"(\"CategoryId\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_RequestSubCategories_CategoryId\" ON \"RequestSubCategories\"(\"CategoryId\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_RequestSubCategoryFields_SubCategoryId\" ON \"RequestSubCategoryFields\"(\"SubCategoryId\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE UNIQUE INDEX IF NOT EXISTS \"IX_RequestSubCategoryFields_SubCategoryId_FieldKey\" ON \"RequestSubCategoryFields\"(\"SubCategoryId\",\"FieldKey\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_RequestStatusHistories_RequestId\" ON \"RequestStatusHistories\"(\"RequestId\");");
        await portalContext.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS \"IX_RequestAttachments_RequestId\" ON \"RequestAttachments\"(\"RequestId\");");

        // --- Tekilleştirme: Önce mevcut tekrarları temizle (çok çalıştırıldıysa) ---
        // 1) Kategori duplicate'lerini tekilleştir (Name bazlı). Önce FK'leri canonical Id'ye taşı.
        await portalContext.Database.ExecuteSqlRawAsync(@"
            WITH canon AS (
                SELECT lower(trim(""Name"")) AS k, MIN(""Id"") AS keep_id
                FROM ""RequestCategories""
                GROUP BY lower(trim(""Name""))
            ),
            dups AS (
                SELECT c.""Id"" AS dup_id, canon.keep_id
                FROM ""RequestCategories"" c
                JOIN canon ON lower(trim(c.""Name"")) = canon.k
                WHERE c.""Id"" <> canon.keep_id
            )
            UPDATE ""RequestSubCategories"" s
            SET ""CategoryId"" = d.keep_id
            FROM dups d
            WHERE s.""CategoryId"" = d.dup_id;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            WITH canon AS (
                SELECT lower(trim(""Name"")) AS k, MIN(""Id"") AS keep_id
                FROM ""RequestCategories""
                GROUP BY lower(trim(""Name""))
            ),
            dups AS (
                SELECT c.""Id"" AS dup_id, canon.keep_id
                FROM ""RequestCategories"" c
                JOIN canon ON lower(trim(c.""Name"")) = canon.k
                WHERE c.""Id"" <> canon.keep_id
            )
            UPDATE ""Requests"" r
            SET ""CategoryId"" = d.keep_id
            FROM dups d
            WHERE r.""CategoryId"" = d.dup_id;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""RequestCategories"" c
            WHERE EXISTS (
                SELECT 1 FROM ""RequestCategories"" c2
                WHERE lower(trim(c2.""Name"")) = lower(trim(c.""Name""))
                GROUP BY lower(trim(c2.""Name""))
                HAVING MIN(c2.""Id"") <> c.""Id""
            );
        ");

        // 2) SubCategory duplicate'lerini tekilleştir (CategoryId+Name)
        await portalContext.Database.ExecuteSqlRawAsync(@"
            WITH canon AS (
                SELECT ""CategoryId"", lower(trim(""Name"")) AS k, MIN(""Id"") AS keep_id
                FROM ""RequestSubCategories""
                GROUP BY ""CategoryId"", lower(trim(""Name""))
            ),
            dups AS (
                SELECT s.""Id"" AS dup_id, canon.keep_id
                FROM ""RequestSubCategories"" s
                JOIN canon ON s.""CategoryId"" = canon.""CategoryId"" AND lower(trim(s.""Name"")) = canon.k
                WHERE s.""Id"" <> canon.keep_id
            )
            UPDATE ""Requests"" r
            SET ""SubCategoryId"" = d.keep_id
            FROM dups d
            WHERE r.""SubCategoryId"" = d.dup_id;
        ");
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""RequestSubCategories"" s
            WHERE EXISTS (
                SELECT 1
                FROM ""RequestSubCategories"" s2
                WHERE s2.""CategoryId"" = s.""CategoryId""
                  AND lower(trim(s2.""Name"")) = lower(trim(s.""Name""))
                GROUP BY s2.""CategoryId"", lower(trim(s2.""Name""))
                HAVING MIN(s2.""Id"") <> s.""Id""
            );
        ");

        // Tekillik sadece aktif parametrelerde uygulanır; pasif/eski hazır kayıtlar adminin aynı isimle yeni kayıt açmasını engellemez.
        await portalContext.Database.ExecuteSqlRawAsync(@"
            DROP INDEX IF EXISTS ""UX_RequestCategories_Name"";
            DROP INDEX IF EXISTS ""UX_RequestSubCategories_CategoryId_Name"";
            CREATE UNIQUE INDEX IF NOT EXISTS ""UX_RequestCategories_Name_Active""
                ON ""RequestCategories""(""Name"")
                WHERE ""IsActive"" = true;
            CREATE UNIQUE INDEX IF NOT EXISTS ""UX_RequestSubCategories_CategoryId_Name_Active""
                ON ""RequestSubCategories""(""CategoryId"", ""Name"")
                WHERE ""IsActive"" = true;
        ");

        // Eski SQL seed yolu varsayılan kapalı; aktif seed RequestSchema ensure sonrasında EF ile yapılır.
        if (app.Configuration.GetValue<bool>("RequestParameters:UseLegacySqlSeed"))
        {
        await portalContext.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""PortalSchemaFixes"" (
                ""Key"" text PRIMARY KEY,
                ""AppliedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')
            );

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM ""PortalSchemaFixes""
                    WHERE ""Key"" = 'request-default-parameters-seeded-20260603'
                ) THEN
                    WITH seed_categories(name, sort_order) AS (
                        VALUES
                            ('İnsan Kaynakları Talepleri', 10),
                            ('Bilgi Teknolojileri Talepleri', 20),
                            ('İdari İşler Talepleri', 30),
                            ('Finans / Muhasebe Talepleri', 40),
                            ('Satın Alma Talepleri', 50),
                            ('Hukuk / KVKK / Uyum Talepleri', 60),
                            ('Proje / Ar-Ge Talepleri', 70),
                            ('Genel Talep / Diğer', 80)
                    ),
                    matched_categories AS (
                        SELECT sc.name, sc.sort_order, existing.""Id"" AS category_id
                        FROM seed_categories sc
                        LEFT JOIN LATERAL (
                            SELECT c.""Id""
                            FROM ""RequestCategories"" c
                            WHERE lower(c.""Name"") = lower(sc.name)
                            ORDER BY CASE WHEN c.""IsActive"" THEN 0 ELSE 1 END, c.""Id""
                            LIMIT 1
                        ) existing ON true
                    ),
                    updated_categories AS (
                        UPDATE ""RequestCategories"" c
                        SET ""Name"" = mc.name,
                            ""SortOrder"" = mc.sort_order,
                            ""IsActive"" = true
                        FROM matched_categories mc
                        WHERE c.""Id"" = mc.category_id
                        RETURNING c.""Id"", c.""Name""
                    ),
                    inserted_categories AS (
                        INSERT INTO ""RequestCategories"" (""Name"", ""SortOrder"", ""IsActive"")
                        SELECT mc.name, mc.sort_order, true
                        FROM matched_categories mc
                        WHERE mc.category_id IS NULL
                        RETURNING ""Id"", ""Name""
                    ),
                    categories AS (
                        SELECT ""Id"", ""Name"" FROM updated_categories
                        UNION ALL
                        SELECT ""Id"", ""Name"" FROM inserted_categories
                    ),
                    seed_subcategories(category_name, name, is_other, sort_order) AS (
                        VALUES
                            ('İnsan Kaynakları Talepleri', 'Çalışma Belgesi', false, 10),
                            ('İnsan Kaynakları Talepleri', 'Maaş Bordrosu', false, 20),
                            ('İnsan Kaynakları Talepleri', 'SGK hizmet dökümü / işe giriş bildirgesi', false, 30),
                            ('İnsan Kaynakları Talepleri', 'Fazla mesai bildirimi', false, 40),
                            ('İnsan Kaynakları Talepleri', 'Konsolosluk yazısı talebi', false, 50),
                            ('İnsan Kaynakları Talepleri', 'Yurtdışı görev yazısı', false, 60),
                            ('İnsan Kaynakları Talepleri', 'Yurtdışı seyahat onayı', false, 70),
                            ('İnsan Kaynakları Talepleri', 'Yurtdışı eğitim/konferans katılım talebi', false, 80),
                            ('İnsan Kaynakları Talepleri', 'Personel bilgi güncelleme', false, 110),
                            ('İnsan Kaynakları Talepleri', 'Aile bilgisi güncelleme', false, 120),
                            ('İnsan Kaynakları Talepleri', 'Askerlik durum güncelleme', false, 130),
                            ('İnsan Kaynakları Talepleri', 'Acil durum kişi bilgisi güncelleme', false, 140),
                            ('İnsan Kaynakları Talepleri', 'Maaş yazısı (İngilizce/Türkçe)', false, 210),
                            ('İnsan Kaynakları Talepleri', 'Çalışma belgesi (Resmi evrak)', false, 220),
                            ('İnsan Kaynakları Talepleri', 'Referans mektubu', false, 230),
                            ('İnsan Kaynakları Talepleri', 'SGK dökümü', false, 240),
                            ('İnsan Kaynakları Talepleri', 'İşten ayrılma yazısı', false, 250),
                            ('İnsan Kaynakları Talepleri', 'Deneyim belgesi', false, 260),
                            ('İnsan Kaynakları Talepleri', 'İş seyahati planlama', false, 310),
                            ('İnsan Kaynakları Talepleri', 'Uçak bileti talebi', false, 320),
                            ('İnsan Kaynakları Talepleri', 'Otel rezervasyonu', false, 330),
                            ('İnsan Kaynakları Talepleri', 'Araç kiralama', false, 340),
                            ('İnsan Kaynakları Talepleri', 'Etkinlik katılım talebi', false, 350),
                            ('Bilgi Teknolojileri Talepleri', 'Kullanıcı hesabı açma / kapatma', false, 10),
                            ('Bilgi Teknolojileri Talepleri', 'Şifre sıfırlama', false, 20),
                            ('Bilgi Teknolojileri Talepleri', 'E-posta hesabı', false, 30),
                            ('Bilgi Teknolojileri Talepleri', 'Yazılım kurulum', false, 40),
                            ('Bilgi Teknolojileri Talepleri', 'Donanım arıza bildirimi', false, 50),
                            ('Bilgi Teknolojileri Talepleri', 'Yetki / rol', false, 60),
                            ('Bilgi Teknolojileri Talepleri', 'Lisans', false, 70),
                            ('Bilgi Teknolojileri Talepleri', 'Yazıcı / ağ / internet problemi', false, 80),
                            ('İdari İşler Talepleri', 'Ofis malzemesi talebi', false, 10),
                            ('İdari İşler Talepleri', 'Toplantı odası düzenleme talebi', false, 20),
                            ('İdari İşler Talepleri', 'Araç / servis / otopark', false, 30),
                            ('İdari İşler Talepleri', 'Kargo / kurye', false, 40),
                            ('İdari İşler Talepleri', 'Temizlik / bakım bildirimi', false, 50),
                            ('Finans / Muhasebe Talepleri', 'Avans talebi', false, 10),
                            ('Finans / Muhasebe Talepleri', 'Maaş Avansı', false, 20),
                            ('Finans / Muhasebe Talepleri', 'İş Avansı (Expense Advance)', false, 30),
                            ('Finans / Muhasebe Talepleri', 'Seyahat Avansı', false, 40),
                            ('Finans / Muhasebe Talepleri', 'Vergi / bordro açıklama', false, 50),
                            ('Satın Alma Talepleri', 'Yazılım lisansı satın alma', false, 10),
                            ('Satın Alma Talepleri', 'Donanım satın alma', false, 20),
                            ('Satın Alma Talepleri', 'Eğitim / danışmanlık satın alma', false, 30),
                            ('Satın Alma Talepleri', 'Ofis ekipmanı satın alma', false, 40),
                            ('Satın Alma Talepleri', 'Abonelik talebi', false, 50),
                            ('Hukuk / KVKK / Uyum Talepleri', 'KVKK aydınlatma / açık rıza talebi', false, 10),
                            ('Hukuk / KVKK / Uyum Talepleri', 'Gizlilik sözleşmesi talebi', false, 20),
                            ('Hukuk / KVKK / Uyum Talepleri', 'Veri silme / düzeltme talebi', false, 30),
                            ('Proje / Ar-Ge Talepleri', 'Yeni proje fikri bildirimi', false, 10),
                            ('Proje / Ar-Ge Talepleri', 'Ar-Ge önerisi', false, 20),
                            ('Proje / Ar-Ge Talepleri', 'Ürün geliştirme talebi', false, 30),
                            ('Proje / Ar-Ge Talepleri', 'Test ortamı talebi', false, 40),
                            ('Proje / Ar-Ge Talepleri', 'API erişim talebi', false, 50),
                            ('Proje / Ar-Ge Talepleri', 'Demo ortamı talebi', false, 60),
                            ('Proje / Ar-Ge Talepleri', 'Teknik dokümantasyon talebi', false, 70),
                            ('Genel Talep / Diğer', 'Genel öneri', false, 10),
                            ('Genel Talep / Diğer', 'Şikayet / geri bildirim', false, 20),
                            ('Genel Talep / Diğer', 'Süreç iyileştirme önerisi', false, 30),
                            ('Genel Talep / Diğer', 'Kurum içi duyuru talebi', false, 40),
                            ('Genel Talep / Diğer', 'Organizasyon talebi', false, 50)
                    ),
                    matched_subcategories AS (
                        SELECT c.""Id"" AS category_id, ss.name, ss.is_other, ss.sort_order, existing.""Id"" AS subcategory_id
                        FROM seed_subcategories ss
                        JOIN categories c ON c.""Name"" = ss.category_name
                        LEFT JOIN LATERAL (
                            SELECT s.""Id""
                            FROM ""RequestSubCategories"" s
                            WHERE s.""CategoryId"" = c.""Id""
                              AND lower(s.""Name"") = lower(ss.name)
                            ORDER BY CASE WHEN s.""IsActive"" THEN 0 ELSE 1 END, s.""Id""
                            LIMIT 1
                        ) existing ON true
                    ),
                    updated_subcategories AS (
                        UPDATE ""RequestSubCategories"" s
                        SET ""Name"" = ms.name,
                            ""IsOther"" = ms.is_other,
                            ""SortOrder"" = ms.sort_order,
                            ""IsActive"" = true
                        FROM matched_subcategories ms
                        WHERE s.""Id"" = ms.subcategory_id
                        RETURNING s.""Id""
                    ),
                    inserted_subcategories AS (
                        INSERT INTO ""RequestSubCategories"" (""CategoryId"", ""Name"", ""IsOther"", ""SortOrder"", ""IsActive"")
                        SELECT ms.category_id, ms.name, ms.is_other, ms.sort_order, true
                        FROM matched_subcategories ms
                        WHERE ms.subcategory_id IS NULL
                        RETURNING ""Id""
                    )
                    SELECT
                        (SELECT count(*) FROM updated_subcategories) +
                        (SELECT count(*) FROM inserted_subcategories)
                    INTO seeded_count;

                    INSERT INTO ""PortalSchemaFixes"" (""Key"")
                    VALUES ('request-default-parameters-seeded-20260603');
                END IF;
            END $$;
        ");
        }
    }
}
catch (Exception) { /* Kolon/tablo zaten var veya DB erişim hatası - uygulama yine de çalışsın */ }

// Request şeması: Yukarıdaki blok herhangi bir noktada hata alınca tümü atlanabiliyor.
// Bu yüzden Request* tabloları/kolonları için ayrı ve güvenli bir "ensure" daha çalıştırıyoruz.
try
{
    using var scope = app.Services.CreateScope();
    var portalContext = scope.ServiceProvider.GetRequiredService<PortalContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("RequestSchema");

    await portalContext.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""RequestCategories"" (
            ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""Name"" text NOT NULL,
            ""SortOrder"" integer NOT NULL DEFAULT 0,
            ""IsActive"" boolean NOT NULL DEFAULT true
        );

        CREATE TABLE IF NOT EXISTS ""RequestSubCategories"" (
            ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""CategoryId"" integer NOT NULL,
            ""Name"" text NOT NULL,
            ""IsOther"" boolean NOT NULL DEFAULT false,
            ""SortOrder"" integer NOT NULL DEFAULT 0,
            ""IsActive"" boolean NOT NULL DEFAULT true
        );

        CREATE TABLE IF NOT EXISTS ""RequestSubCategoryFields"" (
            ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""SubCategoryId"" integer NOT NULL,
            ""FieldKey"" text NOT NULL,
            ""Label"" text NOT NULL,
            ""DataType"" text NOT NULL,
            ""IsRequired"" boolean NOT NULL DEFAULT false,
            ""SortOrder"" integer NOT NULL DEFAULT 0,
            ""IsActive"" boolean NOT NULL DEFAULT true
        );
    ");

    await portalContext.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""RequestCategories""
          ADD COLUMN IF NOT EXISTS ""SortOrder"" integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;

        ALTER TABLE ""RequestSubCategories""
          ADD COLUMN IF NOT EXISTS ""CategoryId"" integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS ""IsOther"" boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS ""SortOrder"" integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;

        ALTER TABLE ""RequestSubCategoryFields""
          ADD COLUMN IF NOT EXISTS ""SubCategoryId"" integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS ""FieldKey"" text NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS ""Label"" text NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS ""DataType"" text NOT NULL DEFAULT 'text',
          ADD COLUMN IF NOT EXISTS ""IsRequired"" boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS ""SortOrder"" integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS ""IsActive"" boolean NOT NULL DEFAULT true;
    ");

    await portalContext.Database.ExecuteSqlRawAsync(@"
        CREATE INDEX IF NOT EXISTS ""IX_RequestSubCategories_CategoryId""
            ON ""RequestSubCategories""(""CategoryId"");
        CREATE INDEX IF NOT EXISTS ""IX_RequestSubCategoryFields_SubCategoryId""
            ON ""RequestSubCategoryFields""(""SubCategoryId"");
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_RequestSubCategoryFields_SubCategoryId_FieldKey""
            ON ""RequestSubCategoryFields""(""SubCategoryId"", ""FieldKey"");
        DROP INDEX IF EXISTS ""UX_RequestCategories_Name"";
        DROP INDEX IF EXISTS ""UX_RequestSubCategories_CategoryId_Name"";
        CREATE UNIQUE INDEX IF NOT EXISTS ""UX_RequestCategories_Name_Active""
            ON ""RequestCategories""(""Name"")
            WHERE ""IsActive"" = true;
        CREATE UNIQUE INDEX IF NOT EXISTS ""UX_RequestSubCategories_CategoryId_Name_Active""
            ON ""RequestSubCategories""(""CategoryId"", ""Name"")
            WHERE ""IsActive"" = true;
    ");

    await portalContext.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""Requests"" (
            ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""UserId"" bigint NOT NULL,
            ""CategoryId"" integer NOT NULL,
            ""SubCategoryId"" integer NOT NULL DEFAULT 0,
            ""OtherText"" text NULL,
            ""Title"" text NOT NULL,
            ""Description"" text NULL,
            ""PayloadJson"" jsonb NOT NULL DEFAULT '{{}}'::jsonb,
            ""Status"" text NOT NULL,
            ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
            ""UpdatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
            ""AssignedToUserId"" bigint NULL,
            ""LastActionByUserId"" bigint NULL,
            ""LastActionNote"" text NULL
        );
    ");

    await portalContext.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""Requests""
          ADD COLUMN IF NOT EXISTS ""PayloadJson"" jsonb NOT NULL DEFAULT '{{}}'::jsonb;
    ");
    await portalContext.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""Requests""
          ADD COLUMN IF NOT EXISTS ""OtherText"" text NULL,
          ADD COLUMN IF NOT EXISTS ""AssignedToUserId"" bigint NULL,
          ADD COLUMN IF NOT EXISTS ""LastActionByUserId"" bigint NULL,
          ADD COLUMN IF NOT EXISTS ""LastActionNote"" text NULL;
    ");
    await portalContext.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""Requests""
          ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc'),
          ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc');
    ");

    await portalContext.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""Requests""
          ADD COLUMN IF NOT EXISTS ""AdminHighlightUserResubmit"" boolean NOT NULL DEFAULT false;
    ");

    logger.LogInformation("Request schema ensure OK (PayloadJson dahil).");
    await SeedDefaultRequestParametersAsync(portalContext, logger);
}
catch (Exception ex)
{
    // Logla ama uygulamayı düşürme
    try
    {
        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("RequestSchema");
        logger.LogWarning(ex, "Request schema ensure FAILED.");
    }
    catch { /* ignore */ }
}

// Service Provider
ServiceTool.ServiceProvider = app.Services;

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Dev ortamında migration'ları otomatik uygula.
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("EFMigrations");

        var dbConnectionString = db.Database.GetConnectionString();
        if (!string.IsNullOrWhiteSpace(dbConnectionString))
        {
            await EnsurePostgresDatabaseExistsAsync(dbConnectionString, logger);
        }

        const string initialMigrationId = "20260424114020_InitialCreate";
        // InitialCreate migration'ında ilk tablo AiTaskPreviews; history ile şema drift'ini tespit için
        var initialFirstTablePresent = await db.Database
            .SqlQueryRaw<int>(
                "SELECT CASE WHEN to_regclass('public.\"AiTaskPreviews\"') IS NOT NULL THEN 1 ELSE 0 END AS \"Value\"")
            .SingleAsync();

        // Bazı ortamlarda DB tabloları manuel/yarım oluşturulmuş olabiliyor ama __EFMigrationsHistory yok.
        // Böyle bir durumda Database.Migrate() ilk tablodan patlar (ör: "nesnesi zaten mevcut") ve her açılışta gürültü üretir.
        // Dev'de sadece güvenli senaryoda migrate et: DB boşsa veya history tablosu varsa.
        var historyExists = await db.Database
            .SqlQueryRaw<int>(
                "SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='__EFMigrationsHistory') THEN 1 ELSE 0 END AS \"Value\"")
            .SingleAsync();

        var hasUserTables = await db.Database
            .SqlQueryRaw<int>(
                "SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name NOT LIKE 'pg_%' AND table_name <> '__EFMigrationsHistory') THEN 1 ELSE 0 END AS \"Value\"")
            .SingleAsync();

        var hadUserTablesBeforeStartupEnsures = databaseHadUserTablesAtStartup == true;

        // __EFMigrationsHistory yok ama uygulama başlamadan önce public şema zaten doluysa:
        // Migrate() tüm "Initial" migration'ı baştan oynatır ve mevcut tablolarla çakışır (42P07).
        // Boş DB'de ise yukarıdaki güvenli ensure blokları birkaç yardımcı tablo oluştursa bile migration çalışmalı.
        if (historyExists == 0 && hadUserTablesBeforeStartupEnsures && (hasUserTables == 1 || initialFirstTablePresent == 1))
        {
            logger.LogWarning(
                "EF migration atlandı: DB tabloları var ama __EFMigrationsHistory yok. " +
                "DataAccess/Scripts/ResetPortalDatabase.sql ile sıfırlayıp dotnet run yapın veya SyncPendingEfMigrations.sql kullanın.");
        }
        else
        {
            if (historyExists == 0 && !hadUserTablesBeforeStartupEnsures)
            {
                logger.LogInformation("Boş veritabanı: tüm migration'lar uygulanacak (son: 20260520120000_EnsurePortalSchemaComplete).");
            }
            var migrator = db.Database.GetService<IMigrator>();
            var pending = db.Database.GetPendingMigrations().ToList();

            // __EFMigrationsHistory varken InitialCreate beklemede, şema uygulandı ama history satırı yok: tekrar CREATE 42P07. Dev'de baseline.
            if (pending.Count > 0
                && string.Equals(pending[0], initialMigrationId, StringComparison.Ordinal)
                && initialFirstTablePresent == 1
                && historyExists == 1)
            {
                var hasInitialInHistory = await db.Database
                    .SqlQueryRaw<int>($@"
                        SELECT CASE WHEN EXISTS (
                            SELECT 1 FROM public.""__EFMigrationsHistory"" WHERE ""MigrationId"" = '{initialMigrationId}')
                        THEN 1 ELSE 0 END AS ""Value""")
                    .SingleAsync();
                if (hasInitialInHistory == 0)
                {
                    await db.Database.ExecuteSqlRawAsync(
                        @"INSERT INTO public.""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                        VALUES ('20260424114020_InitialCreate', '7.0.0');");
                    logger.LogWarning(
                        "EF: InitialCreate şeması mevcut, __EFMigrationsHistory kaydı eksikti; dev ortamında baseline eklendi.");
                    pending = db.Database.GetPendingMigrations().ToList();
                }
            }

            if (pending.Count == 0)
            {
                logger.LogInformation("EF migration: bekleyen migration yok; atlanıyor.");
            }
            else
            {
                try
                {
                    migrator.Migrate();
                    logger.LogInformation("EF migration uygulandı. Pending: {Migrations}", string.Join(", ", pending));
                }
                catch (PostgresException pex) when (pex.SqlState == "42P07")
                {
                    // duplicate_table: şema/EF migration state uyumsuz (çoğu zaman dev DB drift)
                    logger.LogWarning(pex, "EF migration uygulanamadı: nesne zaten mevcut. Dev DB reset veya migration state düzeltmesi gerekebilir.");
                }
            }
        }
    }
    catch (Exception ex)
    {
        // Dev'de uygulama yine de ayağa kalksın; aşağıda kritik tabloları/kolonları IF NOT EXISTS ile güvenceye alıyoruz.
        try
        {
            using var scope = app.Services.CreateScope();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("EFMigrations");
            logger.LogWarning(ex, "EF migrate çalıştırılırken hata alındı; uygulama devam edecek.");
        }
        catch { /* ignore */ }
    }

    // Not paylaşımı için kritik tablo: NoteShares
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        db.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS ""NoteShares"" (
    ""Id"" uuid NOT NULL,
    ""NoteId"" uuid NOT NULL,
    ""UserId"" bigint NOT NULL,
    ""IsReadOnly"" boolean NOT NULL,
    ""SharedAt"" timestamp without time zone NOT NULL,
    CONSTRAINT ""PK_NoteShares"" PRIMARY KEY (""Id"")
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_NoteShares_NoteId_UserId"" ON ""NoteShares"" (""NoteId"", ""UserId"");
");
    }
    catch
    {
        // DB bağlantısı yoksa vs. not paylaşımı zaten 500 dönecek; ama uygulama ayakta kalsın.
    }

    // Etiketleri kullanıcıya özel yapmak için kritik kolon: Tags.UserId
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        db.Database.ExecuteSqlRaw(@"
ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""UserId"" bigint NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS ""IX_Tags_UserId"" ON ""Tags"" (""UserId"");
");
    }
    catch
    {
        // DB bağlantısı yoksa vs. uygulama yine ayakta kalsın.
    }

    // Notes pin özelliği için kritik kolon: Notes.IsPinned
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        db.Database.ExecuteSqlRaw(@"
ALTER TABLE ""Notes"" ADD COLUMN IF NOT EXISTS ""IsPinned"" boolean NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS ""IX_Notes_UserId_IsPinned"" ON ""Notes"" (""UserId"", ""IsPinned"");
");
    }
    catch
    {
        // DB bağlantısı yoksa vs. uygulama yine ayakta kalsın.
    }

    // Notes hatırlatıcı için kritik kolonlar: Notes.ReminderAtUtc / Notes.ReminderSentAtUtc
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        db.Database.ExecuteSqlRaw(@"
ALTER TABLE ""Notes"" ADD COLUMN IF NOT EXISTS ""ReminderAtUtc"" timestamp without time zone NULL;
ALTER TABLE ""Notes"" ADD COLUMN IF NOT EXISTS ""ReminderSentAtUtc"" timestamp without time zone NULL;
CREATE INDEX IF NOT EXISTS ""IX_Notes_UserId_ReminderAtUtc"" ON ""Notes"" (""UserId"", ""ReminderAtUtc"");
");
    }
    catch
    {
        // DB bağlantısı yoksa vs. uygulama yine ayakta kalsın.
    }

    // Not çoklu hatırlatıcı tablosu: NoteReminders
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        db.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS ""NoteReminders"" (
  ""Id"" uuid NOT NULL,
  ""NoteId"" uuid NOT NULL,
  ""UserId"" bigint NOT NULL,
  ""ReminderAtUtc"" timestamp without time zone NOT NULL,
  ""SentAtUtc"" timestamp without time zone NULL,
  ""CreatedAtUtc"" timestamp without time zone NOT NULL,
  CONSTRAINT ""PK_NoteReminders"" PRIMARY KEY (""Id"")
);
CREATE INDEX IF NOT EXISTS ""IX_NoteReminders_NoteId_ReminderAtUtc"" ON ""NoteReminders"" (""NoteId"", ""ReminderAtUtc"");
CREATE INDEX IF NOT EXISTS ""IX_NoteReminders_UserId_ReminderAtUtc"" ON ""NoteReminders"" (""UserId"", ""ReminderAtUtc"");
");
    }
    catch
    {
        // DB bağlantısı yoksa vs. uygulama yine ayakta kalsın.
    }

    // Products stok adedi için kritik kolon: Products.Quantity
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalContext>();
        db.Database.ExecuteSqlRaw(@"
ALTER TABLE ""Products"" ADD COLUMN IF NOT EXISTS ""Quantity"" integer NOT NULL DEFAULT 1;
");
        db.Database.ExecuteSqlRaw(@"
ALTER TABLE ""NewsItems"" ADD COLUMN IF NOT EXISTS ""ServiceArea"" text NULL;
ALTER TABLE ""NewsItems"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT false;
ALTER TABLE ""Announcements"" ADD COLUMN IF NOT EXISTS ""ServiceArea"" text NULL;
ALTER TABLE ""Announcements"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT false;
ALTER TABLE ""Announcements"" ADD COLUMN IF NOT EXISTS ""PublishDate"" timestamp without time zone NOT NULL DEFAULT NOW();
ALTER TABLE ""Notifications"" ADD COLUMN IF NOT EXISTS ""NavigationData"" text NULL;
");
    }
    catch
    {
        // DB bağlantısı yoksa vs. uygulama yine ayakta kalsın.
    }
}

app.UseExceptionMiddleware();

// Development'ta HTTP (ör. http://localhost:5293) üzerinden gelen istekleri HTTPS'e
// yönlendirmeyin: tarayıcı OPTIONS preflight redirect kabul etmez → CORS "Redirect is
// not allowed for a preflight request". Production'da HTTPS zorlaması kalır.
if (hasHttpsEndpoint && !app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 1. Standart wwwroot kullanımı
app.UseStaticFiles();

// 2. file-storage klasörünü "/dosyalar" adıyla dışarı açıyoruz
var fileStoragePath = Path.Combine(builder.Environment.ContentRootPath, "file-storage");

// Klasör yoksa hata vermemesi için oluşturuyoruz
if (!Directory.Exists(fileStoragePath))
{
    Directory.CreateDirectory(fileStoragePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(fileStoragePath),
    RequestPath = "/dosyalar"
});

app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Özel maplemeler
app.MapFileServer("/task-attachments", "task-attachments");
app.MapFileServer("/profile-images", "profile-images");
app.MapFileServer("/user-pdf-attachments", "user-pdf-attachments");
app.MapFileServer("/ticket-attachments", "ticket-attachments");
app.MapFileServer("/news-covers", "news-covers");

app.Run();

static async Task EnsurePostgresDatabaseExistsAsync(string connectionString, ILogger logger)
{
    var csb = new NpgsqlConnectionStringBuilder(connectionString);
    var databaseName = csb.Database;
    if (string.IsNullOrWhiteSpace(databaseName))
        return;

    csb.Database = "postgres";
    await using var conn = new NpgsqlConnection(csb.ConnectionString);
    await conn.OpenAsync();

    await using (var existsCmd = conn.CreateCommand())
    {
        existsCmd.CommandText = "SELECT 1 FROM pg_database WHERE datname = @name";
        existsCmd.Parameters.AddWithValue("name", databaseName);
        var exists = await existsCmd.ExecuteScalarAsync() is not null;
        if (exists)
            return;
    }

    var escapedName = databaseName.Replace("\"", "\"\"", StringComparison.Ordinal);
    await using (var createCmd = conn.CreateCommand())
    {
        createCmd.CommandText = $"CREATE DATABASE \"{escapedName}\"";
        await createCmd.ExecuteNonQueryAsync();
    }

    logger.LogInformation("PostgreSQL veritabanı oluşturuldu: {Database}", databaseName);
}

static async Task SeedDefaultRequestParametersAsync(PortalContext portalContext, ILogger logger)
{
    const string seedKey = "request-default-parameters-fields-seeded-20260603";
    const string legacySeedKey = "request-default-parameters-seeded-20260603";

    await portalContext.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""PortalSchemaFixes"" (
            ""Key"" text PRIMARY KEY,
            ""AppliedAt"" timestamp without time zone NOT NULL DEFAULT (now() at time zone 'utc')
        );
    ");

    var alreadySeeded = await portalContext.Database
        .SqlQueryRaw<int>($@"
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM ""PortalSchemaFixes"" WHERE ""Key"" = '{seedKey}'
            ) THEN 1 ELSE 0 END AS ""Value""")
        .SingleAsync();

    if (alreadySeeded == 1)
        return;

    var seed = new (string Category, int CategoryOrder, (string Name, int SortOrder)[] SubCategories)[]
    {
        ("İnsan Kaynakları Talepleri", 10, new[]
        {
            ("Çalışma Belgesi", 10),
            ("Maaş Bordrosu", 20),
            ("SGK hizmet dökümü / işe giriş bildirgesi", 30),
            ("Fazla mesai bildirimi", 40),
            ("Konsolosluk yazısı talebi", 50),
            ("Yurtdışı görev yazısı", 60),
            ("Yurtdışı seyahat onayı", 70),
            ("Yurtdışı eğitim/konferans katılım talebi", 80),
            ("Personel bilgi güncelleme", 110),
            ("Aile bilgisi güncelleme", 120),
            ("Askerlik durum güncelleme", 130),
            ("Acil durum kişi bilgisi güncelleme", 140),
            ("Maaş yazısı (İngilizce/Türkçe)", 210),
            ("Çalışma belgesi (Resmi evrak)", 220),
            ("Referans mektubu", 230),
            ("SGK dökümü", 240),
            ("İşten ayrılma yazısı", 250),
            ("Deneyim belgesi", 260),
            ("İş seyahati planlama", 310),
            ("Uçak bileti talebi", 320),
            ("Otel rezervasyonu", 330),
            ("Araç kiralama", 340),
            ("Etkinlik katılım talebi", 350),
        }),
        ("Bilgi Teknolojileri Talepleri", 20, new[]
        {
            ("Kullanıcı hesabı açma / kapatma", 10),
            ("Şifre sıfırlama", 20),
            ("E-posta hesabı", 30),
            ("Yazılım kurulum", 40),
            ("Donanım arıza bildirimi", 50),
            ("Yetki / rol", 60),
            ("Lisans", 70),
            ("Yazıcı / ağ / internet problemi", 80),
        }),
        ("İdari İşler Talepleri", 30, new[]
        {
            ("Ofis malzemesi talebi", 10),
            ("Toplantı odası düzenleme talebi", 20),
            ("Araç / servis / otopark", 30),
            ("Kargo / kurye", 40),
            ("Temizlik / bakım bildirimi", 50),
        }),
        ("Finans / Muhasebe Talepleri", 40, new[]
        {
            ("Avans talebi", 10),
            ("Maaş Avansı", 20),
            ("İş Avansı (Expense Advance)", 30),
            ("Seyahat Avansı", 40),
            ("Vergi / bordro açıklama", 50),
        }),
        ("Satın Alma Talepleri", 50, new[]
        {
            ("Yazılım lisansı satın alma", 10),
            ("Donanım satın alma", 20),
            ("Eğitim / danışmanlık satın alma", 30),
            ("Ofis ekipmanı satın alma", 40),
            ("Abonelik talebi", 50),
        }),
        ("Hukuk / KVKK / Uyum Talepleri", 60, new[]
        {
            ("KVKK aydınlatma / açık rıza talebi", 10),
            ("Gizlilik sözleşmesi talebi", 20),
            ("Veri silme / düzeltme talebi", 30),
        }),
        ("Proje / Ar-Ge Talepleri", 70, new[]
        {
            ("Yeni proje fikri bildirimi", 10),
            ("Ar-Ge önerisi", 20),
            ("Ürün geliştirme talebi", 30),
            ("Test ortamı talebi", 40),
            ("API erişim talebi", 50),
            ("Demo ortamı talebi", 60),
            ("Teknik dokümantasyon talebi", 70),
        }),
        ("Genel Talep / Diğer", 80, new[]
        {
            ("Genel öneri", 10),
            ("Şikayet / geri bildirim", 20),
            ("Süreç iyileştirme önerisi", 30),
            ("Kurum içi duyuru talebi", 40),
            ("Organizasyon talebi", 50),
        }),
    };

    var fieldSeed = new Dictionary<string, (string Label, string DataType, bool IsRequired, int SortOrder)[]>(StringComparer.OrdinalIgnoreCase)
    {
        ["Çalışma Belgesi"] = new[]
        {
            ("Belge Dili", "text", true, 10),
            ("Hitap Edilecek Kurum", "text", false, 20),
            ("Kullanım Amacı", "text", false, 30),
        },
        ["Maaş Bordrosu"] = new[]
        {
            ("Bordro Dönemi", "text", true, 10),
            ("Yıl", "text", true, 20),
        },
        ["SGK hizmet dökümü / işe giriş bildirgesi"] = new[]
        {
            ("Belge Türü", "text", true, 10),
            ("Kullanım Amacı", "text", false, 20),
        },
        ["Fazla mesai bildirimi"] = new[]
        {
            ("Mesai Tarihi", "date", true, 10),
            ("Başlangıç Saati", "text", true, 20),
            ("Bitiş Saati", "text", true, 30),
            ("Gerekçe", "text", true, 40),
        },
        ["Konsolosluk yazısı talebi"] = new[]
        {
            ("Seyahat Edilecek Ülke", "text", true, 10),
            ("Hangi Makama Hitaben Hazırlanacak", "text", true, 20),
            ("Seyahat Gidiş Tarihi", "date", true, 30),
            ("Seyahat Dönüş Tarihi", "date", true, 40),
            ("Pasaport No", "text", true, 50),
        },
        ["Yurtdışı görev yazısı"] = new[]
        {
            ("Görev Ülkesi", "text", true, 10),
            ("Görev Amacı", "text", true, 20),
            ("Gidiş Tarihi", "date", true, 30),
            ("Dönüş Tarihi", "date", true, 40),
        },
        ["Yurtdışı seyahat onayı"] = new[]
        {
            ("Seyahat Ülkesi", "text", true, 10),
            ("Şehir", "text", false, 20),
            ("Gidiş Tarihi", "date", true, 30),
            ("Dönüş Tarihi", "date", true, 40),
            ("Seyahat Amacı", "text", true, 50),
        },
        ["Yurtdışı eğitim/konferans katılım talebi"] = new[]
        {
            ("Etkinlik Adı", "text", true, 10),
            ("Ülke / Şehir", "text", true, 20),
            ("Başlangıç Tarihi", "date", true, 30),
            ("Bitiş Tarihi", "date", true, 40),
            ("Davet / Program Dosyası", "file", false, 50),
        },
        ["Personel bilgi güncelleme"] = new[]
        {
            ("Güncellenecek Bilgi Türü", "text", true, 10),
            ("Yeni Bilgi", "text", true, 20),
            ("E-Devlet / Destekleyici Belge", "file", false, 30),
        },
        ["Aile bilgisi güncelleme"] = new[]
        {
            ("Yakınlık Derecesi", "text", true, 10),
            ("Ad Soyad", "text", true, 20),
            ("T.C. / Pasaport No", "text", false, 30),
            ("Doğum Tarihi", "date", false, 40),
        },
        ["Askerlik durum güncelleme"] = new[]
        {
            ("Askerlik Durumu", "text", true, 10),
            ("Terhis Tarihi", "date", false, 20),
            ("Tecil Bitiş Tarihi", "date", false, 30),
            ("E-Devlet Askerlik Belgesi", "file", true, 40),
        },
        ["Acil durum kişi bilgisi güncelleme"] = new[]
        {
            ("Acil Durum Kişisi", "text", true, 10),
            ("Yakınlık Derecesi", "text", true, 20),
            ("Telefon", "text", true, 30),
        },
        ["Maaş yazısı (İngilizce/Türkçe)"] = new[]
        {
            ("Belge Dili", "text", true, 10),
            ("Hitap Edilecek Kurum", "text", false, 20),
            ("Kullanım Amacı", "text", true, 30),
        },
        ["Çalışma belgesi (Resmi evrak)"] = new[]
        {
            ("Belge Dili", "text", true, 10),
            ("Hitap Edilecek Kurum", "text", false, 20),
            ("Kullanım Amacı", "text", true, 30),
        },
        ["Referans mektubu"] = new[]
        {
            ("Belge Dili", "text", true, 10),
            ("Hitap Edilecek Kurum / Kişi", "text", false, 20),
            ("Kullanım Amacı", "text", true, 30),
        },
        ["SGK dökümü"] = new[]
        {
            ("Belge Türü", "text", true, 10),
            ("E-Devlet Belgesi", "file", false, 20),
        },
        ["İşten ayrılma yazısı"] = new[]
        {
            ("Talep Nedeni", "text", true, 10),
            ("Ayrılış Tarihi", "date", false, 20),
        },
        ["Deneyim belgesi"] = new[]
        {
            ("Belge Dili", "text", true, 10),
            ("Kullanılacak Kurum", "text", false, 20),
            ("Kullanım Amacı", "text", true, 30),
        },
        ["İş seyahati planlama"] = new[]
        {
            ("Seyahat Noktası", "text", true, 10),
            ("Gidiş Tarihi", "date", true, 20),
            ("Dönüş Tarihi", "date", true, 30),
            ("Seyahat Amacı", "text", true, 40),
        },
        ["Uçak bileti talebi"] = new[]
        {
            ("Nereden", "text", true, 10),
            ("Nereye", "text", true, 20),
            ("Gidiş Tarihi", "date", true, 30),
            ("Dönüş Tarihi", "date", false, 40),
            ("Uçuş Tercihi", "text", false, 50),
        },
        ["Otel rezervasyonu"] = new[]
        {
            ("Şehir / Bölge", "text", true, 10),
            ("Giriş Tarihi", "date", true, 20),
            ("Çıkış Tarihi", "date", true, 30),
            ("Otel Tercihi", "text", false, 40),
        },
        ["Araç kiralama"] = new[]
        {
            ("Teslim Alma Yeri", "text", true, 10),
            ("Başlangıç Tarihi", "date", true, 20),
            ("Bitiş Tarihi", "date", true, 30),
            ("Araç Tipi", "text", false, 40),
        },
        ["Etkinlik katılım talebi"] = new[]
        {
            ("Etkinlik Adı", "text", true, 10),
            ("Etkinlik Tarihi", "date", true, 20),
            ("Etkinlik Yeri", "text", false, 30),
            ("Katılım Amacı", "text", true, 40),
        },
        ["Kullanıcı hesabı açma / kapatma"] = new[]
        {
            ("İşlem Türü", "text", true, 10),
            ("Kullanıcı Adı", "text", true, 20),
            ("Sistem / Uygulama", "text", true, 30),
            ("İstenen Tarih", "date", false, 40),
        },
        ["Şifre sıfırlama"] = new[]
        {
            ("Sistem / Uygulama", "text", true, 10),
            ("Kullanıcı Adı", "text", true, 20),
        },
        ["E-posta hesabı"] = new[]
        {
            ("İşlem Türü", "text", true, 10),
            ("E-Posta Adresi / Önerisi", "text", false, 20),
            ("Açıklama", "text", false, 30),
        },
        ["Yazılım kurulum"] = new[]
        {
            ("Yazılım Adı", "text", true, 10),
            ("Cihaz Adı / Seri No", "text", false, 20),
            ("Lisans İhtiyacı", "text", false, 30),
        },
        ["Donanım arıza bildirimi"] = new[]
        {
            ("Cihaz Türü", "text", true, 10),
            ("Demirbaş / Seri No", "text", false, 20),
            ("Arıza Açıklaması", "text", true, 30),
            ("Arıza Görseli / Dosya", "file", false, 40),
        },
        ["Yetki / rol"] = new[]
        {
            ("Sistem / Uygulama", "text", true, 10),
            ("İstenen Yetki / Rol", "text", true, 20),
            ("Gerekçe", "text", true, 30),
        },
        ["Lisans"] = new[]
        {
            ("Ürün / Yazılım", "text", true, 10),
            ("Kullanıcı Sayısı", "text", false, 20),
            ("Kullanım Süresi", "text", false, 30),
        },
        ["Yazıcı / ağ / internet problemi"] = new[]
        {
            ("Problem Türü", "text", true, 10),
            ("Lokasyon", "text", true, 20),
            ("Hata Açıklaması", "text", true, 30),
        },
        ["Ofis malzemesi talebi"] = new[]
        {
            ("Malzeme Adı", "text", true, 10),
            ("Adet", "text", true, 20),
            ("Teslim Yeri", "text", false, 30),
        },
        ["Toplantı odası düzenleme talebi"] = new[]
        {
            ("Toplantı Tarihi", "date", true, 10),
            ("Saat Aralığı", "text", true, 20),
            ("Katılımcı Sayısı", "text", false, 30),
            ("Düzen Talebi", "text", false, 40),
        },
        ["Araç / servis / otopark"] = new[]
        {
            ("İhtiyaç Türü", "text", true, 10),
            ("Tarih", "date", true, 20),
            ("Güzergah / Plaka / Açıklama", "text", false, 30),
        },
        ["Kargo / kurye"] = new[]
        {
            ("Alıcı Ad Soyad", "text", true, 10),
            ("Alıcı Adresi", "text", true, 20),
            ("Gönderi İçeriği", "text", true, 30),
        },
        ["Temizlik / bakım bildirimi"] = new[]
        {
            ("Lokasyon", "text", true, 10),
            ("Sorun Türü", "text", true, 20),
            ("Açıklama", "text", true, 30),
            ("Fotoğraf / Dosya", "file", false, 40),
        },
        ["Avans talebi"] = new[]
        {
            ("Avans Türü", "text", true, 10),
            ("Tutar", "text", true, 20),
            ("Para Birimi", "text", true, 30),
            ("İhtiyaç Tarihi", "date", true, 40),
        },
        ["Maaş Avansı"] = new[]
        {
            ("Tutar", "text", true, 10),
            ("Kesinti Ayı", "text", true, 20),
            ("Gerekçe", "text", true, 30),
        },
        ["İş Avansı (Expense Advance)"] = new[]
        {
            ("Tutar", "text", true, 10),
            ("Harcama Amacı", "text", true, 20),
            ("Fatura Kapatma Tarihi", "date", false, 30),
        },
        ["Seyahat Avansı"] = new[]
        {
            ("Seyahat Ülkesi / Şehir", "text", true, 10),
            ("Gidiş Tarihi", "date", true, 20),
            ("Dönüş Tarihi", "date", true, 30),
            ("Talep Edilen Tutar", "text", true, 40),
        },
        ["Vergi / bordro açıklama"] = new[]
        {
            ("Dönem", "text", true, 10),
            ("Konu", "text", true, 20),
            ("Destekleyici Belge", "file", false, 30),
        },
        ["Yazılım lisansı satın alma"] = new[]
        {
            ("Yazılım Adı", "text", true, 10),
            ("Adet / Kullanıcı Sayısı", "text", true, 20),
            ("Kullanım Süresi", "text", false, 30),
            ("Gerekçe", "text", true, 40),
        },
        ["Donanım satın alma"] = new[]
        {
            ("Ürün Adı", "text", true, 10),
            ("Adet", "text", true, 20),
            ("Teknik Özellik", "text", false, 30),
        },
        ["Eğitim / danışmanlık satın alma"] = new[]
        {
            ("Hizmet / Eğitim Adı", "text", true, 10),
            ("Sağlayıcı Firma", "text", false, 20),
            ("Planlanan Tarih", "date", false, 30),
            ("Katılımcı Sayısı", "text", false, 40),
        },
        ["Ofis ekipmanı satın alma"] = new[]
        {
            ("Ürün Adı", "text", true, 10),
            ("Adet", "text", true, 20),
            ("Teslim Yeri", "text", false, 30),
        },
        ["Abonelik talebi"] = new[]
        {
            ("Servis / Abonelik Adı", "text", true, 10),
            ("Plan / Paket", "text", false, 20),
            ("Kullanıcı Sayısı", "text", false, 30),
        },
        ["KVKK aydınlatma / açık rıza talebi"] = new[]
        {
            ("Talep Türü", "text", true, 10),
            ("İlgili Kişi / Kurum", "text", false, 20),
            ("Açıklama", "text", true, 30),
        },
        ["Gizlilik sözleşmesi talebi"] = new[]
        {
            ("Karşı Taraf / Firma", "text", true, 10),
            ("Sözleşme Amacı", "text", true, 20),
            ("Taslak / Ek Dosya", "file", false, 30),
        },
        ["Veri silme / düzeltme talebi"] = new[]
        {
            ("İşlem Türü", "text", true, 10),
            ("Veri Açıklaması", "text", true, 20),
            ("Gerekçe", "text", true, 30),
            ("Destekleyici Belge", "file", false, 40),
        },
        ["Yeni proje fikri bildirimi"] = new[]
        {
            ("Proje Fikri Başlığı", "text", true, 10),
            ("Problem / Fırsat", "text", true, 20),
            ("Beklenen Fayda", "text", true, 30),
        },
        ["Ar-Ge önerisi"] = new[]
        {
            ("Öneri Başlığı", "text", true, 10),
            ("Teknik Açıklama", "text", true, 20),
            ("Beklenen Çıktı", "text", false, 30),
        },
        ["Ürün geliştirme talebi"] = new[]
        {
            ("Ürün / Modül", "text", true, 10),
            ("İhtiyaç Açıklaması", "text", true, 20),
            ("Öncelik", "text", false, 30),
        },
        ["Test ortamı talebi"] = new[]
        {
            ("Proje / Ürün", "text", true, 10),
            ("Ortam Tipi", "text", true, 20),
            ("İhtiyaç Tarihi", "date", false, 30),
        },
        ["API erişim talebi"] = new[]
        {
            ("API Adı", "text", true, 10),
            ("Erişim Amacı", "text", true, 20),
            ("IP / Ortam Bilgisi", "text", false, 30),
        },
        ["Demo ortamı talebi"] = new[]
        {
            ("Ürün / Proje", "text", true, 10),
            ("Demo Tarihi", "date", false, 20),
            ("Müşteri / Kullanım Amacı", "text", false, 30),
        },
        ["Teknik dokümantasyon talebi"] = new[]
        {
            ("Doküman Konusu", "text", true, 10),
            ("Format / Dil", "text", false, 20),
            ("Teslim Tarihi", "date", false, 30),
        },
        ["Genel öneri"] = new[]
        {
            ("Öneri Konusu", "text", true, 10),
            ("Öneri Açıklaması", "text", true, 20),
        },
        ["Şikayet / geri bildirim"] = new[]
        {
            ("Konu", "text", true, 10),
            ("İlgili Birim", "text", false, 20),
            ("Açıklama", "text", true, 30),
        },
        ["Süreç iyileştirme önerisi"] = new[]
        {
            ("Süreç Adı", "text", true, 10),
            ("Mevcut Sorun", "text", true, 20),
            ("Önerilen Çözüm", "text", true, 30),
        },
        ["Kurum içi duyuru talebi"] = new[]
        {
            ("Duyuru Başlığı", "text", true, 10),
            ("Yayın Tarihi", "date", false, 20),
            ("Hedef Kitle", "text", false, 30),
            ("Duyuru Metni", "text", true, 40),
        },
        ["Organizasyon talebi"] = new[]
        {
            ("Organizasyon Adı", "text", true, 10),
            ("Organizasyon Tarihi", "date", true, 20),
            ("Katılımcı Sayısı", "text", false, 30),
            ("Açıklama", "text", false, 40),
        },
    };

    var categories = await portalContext.RequestCategories.ToListAsync();
    var subCategories = await portalContext.RequestSubCategories.ToListAsync();
    var fields = await portalContext.RequestSubCategoryFields.ToListAsync();

    foreach (var categorySeed in seed)
    {
        var category = categories
            .OrderBy(x => x.IsActive ? 0 : 1)
            .ThenBy(x => x.Id)
            .FirstOrDefault(x => string.Equals(x.Name?.Trim(), categorySeed.Category, StringComparison.OrdinalIgnoreCase));

        if (category is null)
        {
            category = new RequestCategoryEntity
            {
                Name = categorySeed.Category,
                SortOrder = categorySeed.CategoryOrder,
                IsActive = true,
            };
            portalContext.RequestCategories.Add(category);
            categories.Add(category);
        }
        else
        {
            category.Name = categorySeed.Category;
            category.SortOrder = categorySeed.CategoryOrder;
            category.IsActive = true;
        }

        await portalContext.SaveChangesAsync();

        foreach (var subSeed in categorySeed.SubCategories)
        {
            var subCategory = subCategories
                .Where(x => x.CategoryId == category.Id)
                .OrderBy(x => x.IsActive ? 0 : 1)
                .ThenBy(x => x.Id)
                .FirstOrDefault(x => string.Equals(x.Name?.Trim(), subSeed.Name, StringComparison.OrdinalIgnoreCase));

            if (subCategory is null)
            {
                subCategory = new RequestSubCategoryEntity
                {
                    CategoryId = category.Id,
                    Name = subSeed.Name,
                    IsOther = false,
                    SortOrder = subSeed.SortOrder,
                    IsActive = true,
                };
                portalContext.RequestSubCategories.Add(subCategory);
                subCategories.Add(subCategory);
            }
            else
            {
                subCategory.Name = subSeed.Name;
                subCategory.IsOther = false;
                subCategory.SortOrder = subSeed.SortOrder;
                subCategory.IsActive = true;
            }

            await portalContext.SaveChangesAsync();

            if (fieldSeed.TryGetValue(subSeed.Name, out var subFields))
            {
                foreach (var field in subFields)
                {
                    var fieldKey = NormalizeSeedFieldKey(field.Label);
                    var existingField = fields
                        .Where(x => x.SubCategoryId == subCategory.Id)
                        .OrderBy(x => x.IsActive ? 0 : 1)
                        .ThenBy(x => x.Id)
                        .FirstOrDefault(x =>
                            string.Equals(x.FieldKey?.Trim(), fieldKey, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(x.Label?.Trim(), field.Label, StringComparison.OrdinalIgnoreCase));

                    if (existingField is null)
                    {
                        existingField = new RequestSubCategoryFieldEntity
                        {
                            SubCategoryId = subCategory.Id,
                            FieldKey = fieldKey,
                            Label = field.Label,
                            DataType = field.DataType,
                            IsRequired = field.IsRequired,
                            SortOrder = field.SortOrder,
                            IsActive = true,
                        };
                        portalContext.RequestSubCategoryFields.Add(existingField);
                        fields.Add(existingField);
                    }
                    else
                    {
                        existingField.FieldKey = fieldKey;
                        existingField.Label = field.Label;
                        existingField.DataType = field.DataType;
                        existingField.IsRequired = field.IsRequired;
                        existingField.SortOrder = field.SortOrder;
                        existingField.IsActive = true;
                    }
                }
            }
        }

        await portalContext.SaveChangesAsync();
    }

    await portalContext.Database.ExecuteSqlRawAsync($@"
        INSERT INTO ""PortalSchemaFixes"" (""Key"")
        VALUES ('{seedKey}')
        ON CONFLICT (""Key"") DO NOTHING;

        INSERT INTO ""PortalSchemaFixes"" (""Key"")
        VALUES ('{legacySeedKey}')
        ON CONFLICT (""Key"") DO NOTHING;
    ");

    logger.LogInformation("Talep Yönetimi default kategori ve alt kategorileri seed edildi.");
}

static string NormalizeSeedFieldKey(string value)
{
    var chars = (value ?? string.Empty)
        .Trim()
        .ToLowerInvariant()
        .Select(ch => char.IsLetterOrDigit(ch) ? ch : '_')
        .ToArray();
    var raw = new string(chars);
    while (raw.Contains("__", StringComparison.Ordinal))
        raw = raw.Replace("__", "_", StringComparison.Ordinal);
    return raw.Trim('_');
}
