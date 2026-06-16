namespace Core.Utilities.Results.Abstract
{
    public interface IPaginatedResult<out T> : IResult
    {
        T Data { get; }
        int TotalCount { get; set; }
        int PageNumber { get; set; }
        int PageSize { get; set; }
        int TotalPages { get; }
    }
}
