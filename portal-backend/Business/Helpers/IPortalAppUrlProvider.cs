namespace Business.Helpers
{
    /// <summary>Merkezi uygulama URL’si (<c>AppSettings:AppUrl</c>).</summary>
    public interface IPortalAppUrlProvider
    {
        string GetAppBaseUrl();

        /// <summary>{base}/email-verify?value=</summary>
        string GetEmailVerifyLinkPrefix();

        /// <summary>{base}/reset-password?value=</summary>
        string GetPasswordResetLinkPrefix();
    }
}
