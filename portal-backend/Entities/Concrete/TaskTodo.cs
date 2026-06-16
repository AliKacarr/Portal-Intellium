namespace Entities.Concrete
{
    public class TaskTodo
    {
        public int Id { get; set; }
        public int TaskTodoListId { get; set; }
        public string Content { get; set; }
        public bool State { get; set; } = false;
		public DateTime CreatedDate { get; set; } = DateTime.Now;
		public DateTime? CompletedDate { get; set; }
		public long? CompletedByUserId { get; set; }
	}
}
