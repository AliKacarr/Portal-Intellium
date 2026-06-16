using Core.Utilities.Results.Abstract;

namespace Core.Utilities.Results.Concrete
{
    public class PaginatedResult<T> : Result, IPaginatedResult<T>
    {
        public PaginatedResult(T data, bool success, string message) : base(success, message)
        {
            Data = data;
        }
        public PaginatedResult(T data, bool success) : base(success)
        {
            Data = data;
        }
        public T Data { get; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
