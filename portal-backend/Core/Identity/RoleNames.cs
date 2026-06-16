namespace Core.Identity
{
	public static class RoleNames
	{
		public const string Admin = "admin";
		public const string User = "user";
		public const string Worker = "worker";
		public const string WorkerOutsource = "worker-outsource";
		// Legacy/seed uyumluluğu: bazı ortamlarda rol adı bu şekilde geçiyor.
		public const string WorkerOutsourced = "worker-outsourced";

		/// <summary>Haber / duyuru / anket okuma yetkisi olan roller.</summary>
		public const string PortalReaders = "admin,worker,user,worker-outsource";
	}
}
