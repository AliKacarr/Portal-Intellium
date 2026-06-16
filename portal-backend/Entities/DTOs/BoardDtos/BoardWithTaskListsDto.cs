namespace Entities.DTOs.BoardDtos
{
    public class BoardWithTaskListsDto
    {
        public string Name { get; set; }
        public List<BoardTaskListDto> TaskLists { get; set; }
    }
}
