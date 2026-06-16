using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class AddAgreementVersioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Agreements",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agreements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserAgreements",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    AgreementId = table.Column<long>(type: "bigint", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAgreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAgreements_Agreements_AgreementId",
                        column: x => x.AgreementId,
                        principalTable: "Agreements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserAgreements_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_Type_IsActive",
                table: "Agreements",
                columns: new[] { "Type", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_Type_Version",
                table: "Agreements",
                columns: new[] { "Type", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAgreements_AgreementId",
                table: "UserAgreements",
                column: "AgreementId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAgreements_UserId_AgreementId",
                table: "UserAgreements",
                columns: new[] { "UserId", "AgreementId" },
                unique: true);

            migrationBuilder.Sql(@"
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Agreements_Active_Type""
ON ""Agreements"" (""Type"")
WHERE ""IsActive"" = TRUE;

INSERT INTO ""Agreements"" (""Type"", ""Content"", ""Version"", ""IsActive"", ""CreatedAt"")
SELECT 1, $kvkk$KİŞİSEL VERİLERİN KORUNMASI KANUNU AYDINLATMA METNİ

İşbu Aydınlatma Metni, portal hizmetlerinden yararlanan kullanıcıların kişisel verilerinin 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında hangi amaçlarla işlendiği, hangi yöntemlerle toplandığı, kimlerle paylaşılabileceği ve veri sahiplerinin hakları konusunda bilgilendirilmesi amacıyla hazırlanmıştır.

Portal kapsamında; ad, soyad, e-posta adresi, kullanıcı rolü, şirket bilgisi, hesap durumu, oturum bilgileri, IP adresi, işlem kayıtları, sistem logları, cihaz ve tarayıcı bilgileri ile kullanıcı hareketlerine ilişkin işlem güvenliği verileri işlenebilmektedir.

Kişisel verileriniz;

* kullanıcı hesabının oluşturulması ve yönetilmesi,
* kimlik doğrulama ve yetkilendirme süreçlerinin yürütülmesi,
* portal hizmetlerinin güvenli şekilde sunulması,
* bilgi güvenliği süreçlerinin sağlanması,
* kullanıcı işlemlerinin kayıt altına alınması,
* sistem performansının izlenmesi ve geliştirilmesi,
* denetim ve iç kontrol faaliyetlerinin yürütülmesi,
* hukuki yükümlülüklerin yerine getirilmesi,
* olası uyuşmazlıklarda delil ve ispat yükümlülüklerinin yerine getirilmesi,
* yetkisiz erişim, güvenlik ihlali ve kötüye kullanım risklerinin önlenmesi

amaçlarıyla işlenebilmektedir.

Kişisel verileriniz; elektronik ortamda otomatik veya otomatik olmayan yöntemlerle, portal sistemleri, kullanıcı giriş ekranları, log kayıtları, güvenlik altyapıları, e-posta iletişimleri ve ilgili bilgi sistemleri aracılığıyla toplanabilmektedir.

Verileriniz; KVKK’nın 5. maddesinde belirtilen;

* bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması,
* veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi,
* bir hakkın tesisi, kullanılması veya korunması,
* veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması

hukuki sebeplerine dayanılarak işlenmektedir.

Portal güvenliğinin sağlanması amacıyla kullanıcı hareketleri, oturum kayıtları, IP bilgileri, işlem geçmişi, tarih-saat bilgileri, yetki değişiklikleri ve sistem logları kayıt altına alınabilmekte; bu kayıtlar güvenlik, denetim, operasyonel süreklilik ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılabilmektedir.

Kişisel verileriniz; yalnızca ilgili mevzuata uygun olarak ve gerekli güvenlik tedbirleri alınarak;

* yetkili kamu kurum ve kuruluşları,
* hukuk, denetim ve danışmanlık hizmeti alınan taraflar,
* sistem altyapısı, barındırma, bakım, destek ve güvenlik hizmeti sağlayıcıları,
* e-posta ve bildirim altyapısı hizmet sağlayıcıları

ile işleme amacıyla sınırlı olmak üzere paylaşılabilecektir.

Kişisel verileriniz, ilgili mevzuatta öngörülen saklama süreleri boyunca veya işleme amacının gerektirdiği süre kadar muhafaza edilmekte; saklama süresi sonunda ilgili mevzuata uygun şekilde silinmekte, yok edilmekte veya anonim hale getirilmektedir.

Verilerinizin güvenliğinin sağlanması amacıyla erişim kontrolü, yetkilendirme, loglama, şifreleme, sistem izleme, yedekleme ve benzeri teknik ve idari güvenlik tedbirleri uygulanmaktadır.

KVKK’nın 11. maddesi kapsamında;

* kişisel verilerinizin işlenip işlenmediğini öğrenme,
* işlenmişse buna ilişkin bilgi talep etme,
* işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
* eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme,
* ilgili mevzuat kapsamında silinmesini veya yok edilmesini talep etme,
* yapılan işlemlerin üçüncü kişilere bildirilmesini isteme,
* işlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi nedeniyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
* kanuna aykırı işlenmesi nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme

haklarına sahipsiniz.

KVKK kapsamındaki taleplerinizi ilgili iletişim kanalları üzerinden iletebilirsiniz. Başvurularınız, talebin niteliğine göre ilgili mevzuatta öngörülen süreler içerisinde değerlendirilerek sonuçlandırılacaktır.$kvkk$, 1, TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM ""Agreements"" WHERE ""Type"" = 1 AND ""Version"" = 1);

INSERT INTO ""Agreements"" (""Type"", ""Content"", ""Version"", ""IsActive"", ""CreatedAt"")
SELECT 2, $riza$AÇIK RIZA METNİ

Portal hizmetlerinin sunulması kapsamında;

* kullanıcı hesabımın oluşturulması ve yönetilmesi,
* şifre oluşturma ve şifre sıfırlama süreçlerinin yürütülmesi,
* hesap doğrulama işlemlerinin gerçekleştirilmesi,
* güvenlik bildirimleri ve sistem bilgilendirmelerinin gönderilmesi,
* rol ve yetki bilgilerime uygun portal ekranlarının, görevlerin ve bildirim akışlarının sunulması,
* işlem güvenliğinin sağlanması,
* kullanıcı deneyiminin geliştirilmesi,
* sistem güvenliği, denetim ve operasyonel süreçlerin yürütülmesi

amaçlarıyla kişisel verilerimin işlenmesine açık rıza verdiğimi kabul ederim.

Bu kapsamda;

* ad, soyad,
* e-posta adresi,
* kullanıcı rolü ve yetki bilgileri,
* şirket bilgileri,
* oturum ve işlem kayıtları,
* IP adresi,
* cihaz ve tarayıcı bilgileri,
* sistem logları ve güvenlik kayıtları

işlenebilecektir.

Tarafıma gönderilecek e-posta iletileri; hesap doğrulama, şifre oluşturma, şifre yenileme, güvenlik bilgilendirmeleri ve portal kullanımına ilişkin zorunlu işlem bildirimleri kapsamında olup reklam veya pazarlama amacı taşımamaktadır.

Açık rızam kapsamında işlenen kişisel verilerimin; ilgili mevzuatta öngörülen süreler boyunca veya işleme amacının gerektirdiği süre kadar muhafaza edilebileceğini, gerekli teknik ve idari güvenlik tedbirleri kapsamında korunacağını biliyorum.

Açık rızamı dilediğim zaman geri çekebileceğim; ancak açık rızanın geri çekilmesinin, geri çekme tarihinden önce gerçekleştirilen veri işleme faaliyetlerinin hukuka uygunluğunu etkilemeyeceği konusunda bilgilendirildiğimi kabul ederim.

Açık rızamı geri çekmem halinde; hesap doğrulama, şifre sıfırlama, güvenlik bildirimi veya rol bazlı bildirim süreçleri gibi portalın bazı işlevlerinden yararlanamayabileceğimi biliyorum.

İşbu metni okuyup onaylayarak, yukarıda belirtilen kapsamda kişisel verilerimin işlenmesine açık rıza verdiğimi kabul ederim.$riza$, 1, TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM ""Agreements"" WHERE ""Type"" = 2 AND ""Version"" = 1);

INSERT INTO ""UserAgreements"" (""UserId"", ""AgreementId"", ""AcceptedAt"")
SELECT u.""Id"", a.""Id"", u.""LegalConsentAcceptedAt""
FROM ""Users"" u
JOIN ""Agreements"" a ON a.""Type"" IN (1, 2) AND a.""Version"" = 1
WHERE u.""LegalConsentAcceptedAt"" IS NOT NULL
ON CONFLICT (""UserId"", ""AgreementId"") DO NOTHING;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserAgreements");

            migrationBuilder.DropTable(
                name: "Agreements");
        }
    }
}
