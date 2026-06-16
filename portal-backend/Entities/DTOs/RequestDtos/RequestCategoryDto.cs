using System.Collections.Generic;

namespace Entities.DTOs.RequestDtos
{
    public class RequestSubCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsOther { get; set; }
        public int SortOrder { get; set; }
        public List<RequestSubCategoryFieldDto> Fields { get; set; } = new();
    }

    public class RequestSubCategoryFieldDto
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string DataType { get; set; } = "text";
        public bool IsRequired { get; set; }
        public int SortOrder { get; set; }
    }

    public class RequestCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public List<RequestSubCategoryDto> SubCategories { get; set; } = new();
    }
}

