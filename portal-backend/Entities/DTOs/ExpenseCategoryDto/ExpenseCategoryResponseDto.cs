namespace Entities.DTOs.ExpenseCategoryDto
{
    public class ExpenseCategoryResponseDto
    {
        public int Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public bool System { get; set; }
        public bool Visible { get; set; }
        public List<string> Aliases { get; set; } = new();
    }
}
