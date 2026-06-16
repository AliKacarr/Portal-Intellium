using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.ExpenseDto;

namespace Business.Mapping.AutoMapper
{
	public class ExpenseMapping : Profile
	{
		public ExpenseMapping()
		{
			// Expense mapping işlemleri ExpenseManager içinde kurallarla (normalize/hesaplama) yapılıyor.
			// Bu profile boş kalabilir; AutoMapper taraması bu profili buluyor.
		}
	}
}
