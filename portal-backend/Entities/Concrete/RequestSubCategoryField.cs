namespace Entities.Concrete
{
    public class RequestSubCategoryField
    {
        public int Id { get; set; }
        public int SubCategoryId { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string DataType { get; set; } = "text";
        public bool IsRequired { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
