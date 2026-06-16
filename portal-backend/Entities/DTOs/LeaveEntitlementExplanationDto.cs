using System;
using System.Collections.Generic;

namespace Entities.DTOs
{
    public class LeaveEntitlementExplanationDto
    {
        public bool HasJobStartDate { get; set; }
        public DateTime? JobStartDate { get; set; }
        public DateTime? BirthDate { get; set; }
        public LeaveThisYearDetailDto? ThisYearDetail { get; set; }
        public List<LeaveAnnualAccrualRowDto> AnnualAccruals { get; set; } = new();
        public List<LeaveUsedSummaryItemDto> UsedLeaveSummary { get; set; } = new();
        public List<LeaveUsedDetailItemDto> UsedLeaveDetails { get; set; } = new();
        public List<LeaveRuleTableRowDto> RulesTable { get; set; } = LeaveRuleTableRows.Default;
    }

    public class LeaveThisYearDetailDto
    {
        public int SeniorityYears { get; set; }
        public int Age { get; set; }
        public int ThisYearDays { get; set; }
        public string AppliedRuleSummary { get; set; } = string.Empty;
    }

    public class LeaveAnnualAccrualRowDto
    {
        public int ServiceYearIndex { get; set; }
        public DateTime AnniversaryDate { get; set; }
        public int AgeAtAnniversary { get; set; }
        public int DaysEarned { get; set; }
    }

    public class LeaveUsedSummaryItemDto
    {
        public string PermissionTypeName { get; set; } = string.Empty;
        public double TotalDays { get; set; }
        public int RequestCount { get; set; }
    }

    public class LeaveUsedDetailItemDto
    {
        public int PermissionId { get; set; }
        public string PermissionTypeName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double Amount { get; set; }
        public string Unit { get; set; } = "gün";
        public string Status { get; set; } = string.Empty;
        public string StatusLabel { get; set; } = string.Empty;
    }

    public class LeaveRuleTableRowDto
    {
        public string SeniorityRange { get; set; } = string.Empty;
        public string AgeCondition { get; set; } = string.Empty;
        public string LeaveDays { get; set; } = string.Empty;
    }

    public static class LeaveRuleTableRows
    {
        public static List<LeaveRuleTableRowDto> Default => new()
        {
            new LeaveRuleTableRowDto { SeniorityRange = "x < 1 yıl", AgeCondition = "—", LeaveDays = "0 gün" },
            new LeaveRuleTableRowDto { SeniorityRange = "1 ≤ x < 5 yıl", AgeCondition = "≤ 18 yaş veya ≥ 50 yaş", LeaveDays = "20 gün" },
            new LeaveRuleTableRowDto { SeniorityRange = "1 ≤ x < 5 yıl", AgeCondition = "18 < yaş < 50", LeaveDays = "14 gün" },
            new LeaveRuleTableRowDto { SeniorityRange = "5 ≤ x < 15 yıl", AgeCondition = "—", LeaveDays = "20 gün" },
            new LeaveRuleTableRowDto { SeniorityRange = "x ≥ 15 yıl", AgeCondition = "—", LeaveDays = "26 gün" }
        };
    }
}
