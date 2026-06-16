using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.BoardDtos;

namespace Business.Mapping.AutoMapper
{
	public class BoardMapping : Profile
	{
		public BoardMapping()
		{
			CreateMap<Board, AddBoardDto>().ReverseMap();
			CreateMap<Board, EditBoardDto>().ReverseMap();
		}
	}
}
