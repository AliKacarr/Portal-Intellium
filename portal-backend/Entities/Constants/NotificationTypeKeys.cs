namespace Entities.Constants
{
	/// <summary>Masraf ve diğer bildirimlerde Type alanında kullanılan string anahtarlar (DB/JSON).</summary>
	public static class NotificationTypeKeys
	{
		public const string ExpenseReminder = "expensereminder";
		/// <summary>Onay kuyruğu / yönetici iş yükü — yalnızca admin ve worker listelerinde gösterilir.</summary>
		public const string ExpenseReminderAdminQueue = "expensereminder_admin";

		// Masraf talebi durum güncellemeleri (bildirim + mail) — yalnızca masrafı oluşturan kullanıcıya gider.
		public const string ExpenseRevisionRequested = "expense_revision_requested";
		public const string ExpenseApproved = "expense_approved";
		public const string ExpenseRejected = "expense_rejected";

		// Talep yönetimi (Request) bildirimleri
		/// <summary>Yeni talep oluşturuldu: admin kuyruğu.</summary>
		public const string RequestCreatedAdminQueue = "request_created_admin";
		/// <summary>Talep durum güncellemesi: talep sahibine gider.</summary>
		public const string RequestStatusChanged = "request_status_changed";

		// Not hatırlatıcı
		/// <summary>Not hatırlatıcısı zamanı geldi: not sahibine gider.</summary>
		public const string NoteReminder = "note_reminder";

		// --- Portal Haber / Duyuru / Anket Modülleri ---
		public const string Announcement = "Announcement";
		public const string News = "News";
		public const string Poll = "Poll";

		public const string NewsComment = "news_comment";
	}
}
