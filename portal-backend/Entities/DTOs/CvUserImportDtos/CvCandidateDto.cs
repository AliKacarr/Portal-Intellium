namespace Entities.DTOs.CvUserImportDtos
{
    public class CvCandidateDto
    {
        public CvCandidateAccountDto Account { get; set; } = new();
        public CvCandidateProfileDto Profile { get; set; } = new();
        public List<string> Skills { get; set; } = new();
        public List<CvCandidateJobExperienceDto> JobExperiences { get; set; } = new();
        public List<CvCandidateEducationDto> Educations { get; set; } = new();
        public List<CvCandidateLanguageDto> Languages { get; set; } = new();
        public List<CvCandidateCertificateDto> Certificates { get; set; } = new();
    }

    public class CvCandidateAccountDto
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Language { get; set; }
        public long? UserRole { get; set; }
        public long? Customer { get; set; }
        public string? CurrentTitle { get; set; }
        public string? Timezone { get; set; }
        public bool? IsActive { get; set; }
    }

    public class CvCandidateProfileDto
    {
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Adress { get; set; }
        public string? Country { get; set; }
        public string? Province { get; set; }
        public string? District { get; set; }
        public string? TelNo { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Phone { get; set; }
        public string? Telefon { get; set; }
        public string? GithubUrl { get; set; }
        public string? LinkedInUrl { get; set; }
    }

    public class CvCandidateJobExperienceDto
    {
        public string? CompanyName { get; set; }
        public string? JobTitle { get; set; }
        public string? Duty { get; set; }
        public string? StartDate { get; set; }
        public string? DepartureDate { get; set; }
    }

    public class CvCandidateEducationDto
    {
        public string? CompletedEducation { get; set; }
        public string? School { get; set; }
        public string? Department { get; set; }
        public string? Scholarship { get; set; }
        public string? GradePoint { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
    }

    public class CvCandidateLanguageDto
    {
        public string? ForeignLanguage { get; set; }
        public string? Read { get; set; }
        public string? Write { get; set; }
        public string? Speaking { get; set; }
        public string? DocumentPath { get; set; }
    }

    public class CvCandidateCertificateDto
    {
        public string? CertificateName { get; set; }
        public string? CertificateNo { get; set; }
        public string? InstitutionName { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? CertificateExamMark { get; set; }
    }
}
