using Core.DataAccess.EntityFramework;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;
using Entities.DTOs.ProjectDtos;
using Entities.DTOs.TicketDtos;
using Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.TicketRepository
{
    public class EfTicketDal : EfEntityRepositoryBase<Ticket, PortalContext>, ITicketDal
    {
        public bool CanUserAccessTicket(long ticketId, long customerId, long userId)
        {
            using var context = new PortalContext();
            var accessibleTickets = (from ticket in context.Tickets
                                     where ticket.Id == ticketId &&
                                           (ticket.CustomerId == customerId ||
                                            context.ProjectTeamMembers.Any(member =>
                                                member.UserId == userId &&
                                                context.ProjectTeams.Any(team =>
                                                    team.Id == member.ProjectTeamId &&
                                                    team.ProjectId == ticket.ProjectId)))
                                     select ticket.Id).Any();

            return accessibleTickets;
        }

        public List<GetTicketDto> GetAllAsDto()
        {
            using var context = new PortalContext();
            var result = (from ticket in context.Tickets
                          select new GetTicketDto
                          {
                              Id = ticket.Id,
                              Name = ticket.Name,
                              Description = ticket.Description,
                              Status = ticket.Status,
                              CreationDate = ticket.CreationDate,
                              AssignedDate = ticket.AssignedDate,
                              ResolutionDate = ticket.ResolutionDate,
                              RequestType = ticket.RequestType,
                              AssignedUser = context.Users.Where(u => u.Id.Equals(ticket.AssignedUserId)).Select(user => new TicketUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault(),
                              CreatorUser = context.Users.Where(u => u.Id.Equals(ticket.CreatorUserId)).Select(user => new TicketUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault()!,
                              Customer = context.Customers.Where(c => c.CustomerId.Equals(ticket.CustomerId)).Select(customer => new BasicCustomerDto
                              {
                                  CustomerId = customer.CustomerId,
                                  CustomerName = customer.CustomerName
                              }).SingleOrDefault()!,
                              Project = context.Projects.Where(p => p.Id.Equals(ticket.ProjectId)).Select(project => new ProjectForTicketDto
                              {
                                  Id = project.Id,
                                  ProjectName = project.ProjectName,
                              }).SingleOrDefault()!
                          }).ToList();

            return result;
        }

        public async Task<IResult> GetPaginatedAsync(int pageNumber, int pageSize)
        {
            using var context = new PortalContext();
            var query = from ticket in context.Tickets
                        select new GetTicketDto
                        {
                            Id = ticket.Id,
                            Name = ticket.Name,
                            Description = ticket.Description,
                            Status = ticket.Status,
                            CreationDate = ticket.CreationDate,
                            AssignedDate = ticket.AssignedDate,
                            ResolutionDate = ticket.ResolutionDate,
                            RequestType = ticket.RequestType,
                            AssignedUser = context.Users.Where(u => u.Id.Equals(ticket.AssignedUserId)).Select(user => new TicketUserDto
                            {
                                Id = user.Id,
                                Name = user.Name,
                                ImageUrl = user.ImageUrl,
                                IsActive = user.IsActive
                            }).SingleOrDefault(),
                            CreatorUser = context.Users.Where(u => u.Id.Equals(ticket.CreatorUserId)).Select(user => new TicketUserDto
                            {
                                Id = user.Id,
                                Name = user.Name,
                                ImageUrl = user.ImageUrl,
                                IsActive = user.IsActive
                            }).SingleOrDefault()!,
                            Customer = context.Customers.Where(c => c.CustomerId.Equals(ticket.CustomerId)).Select(customer => new BasicCustomerDto
                            {
                                CustomerId = customer.CustomerId,
                                CustomerName = customer.CustomerName
                            }).SingleOrDefault()!,
                            Project = context.Projects.Where(p => p.Id.Equals(ticket.ProjectId)).Select(project => new ProjectForTicketDto
                            {
                                Id = project.Id,
                                ProjectName = project.ProjectName,
                            }).SingleOrDefault()!
                        };

            var totalCount = await query.CountAsync();
            var paginatedTickets = await query
                .OrderBy(t => t.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return paginatedTickets.Any() ? new PaginatedResult<List<GetTicketDto>>(paginatedTickets, true)
            {
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            } : new ErrorResult();
        }

        public List<GetTicketDto> GetAllByCustomerAndUser(long customerId, long userId)
        {
            using var context = new PortalContext();
            var customerTickets = (from ticket in context.Tickets
                                   where ticket.CustomerId == customerId
                                   select new GetTicketDto
                                   {
                                       Id = ticket.Id,
                                       Name = ticket.Name,
                                       Description = ticket.Description,
                                       Status = ticket.Status,
                                       CreationDate = ticket.CreationDate,
                                       AssignedDate = ticket.AssignedDate,
                                       ResolutionDate = ticket.ResolutionDate,
                                       RequestType = ticket.RequestType,
                                       AssignedUser = context.Users
                                           .Where(u => u.Id.Equals(ticket.AssignedUserId))
                                           .Select(user => new TicketUserDto
                                           {
                                               Id = user.Id,
                                               Name = user.Name,
                                               ImageUrl = user.ImageUrl,
                                               IsActive = user.IsActive
                                           }).SingleOrDefault(),
                                       CreatorUser = context.Users
                                           .Where(u => u.Id.Equals(ticket.CreatorUserId))
                                           .Select(user => new TicketUserDto
                                           {
                                               Id = user.Id,
                                               Name = user.Name,
                                               ImageUrl = user.ImageUrl,
                                               IsActive = user.IsActive
                                           }).SingleOrDefault()!,
                                       Customer = context.Customers
                                           .Where(c => c.CustomerId.Equals(ticket.CustomerId))
                                           .Select(customer => new BasicCustomerDto
                                           {
                                               CustomerId = customer.CustomerId,
                                               CustomerName = customer.CustomerName
                                           }).SingleOrDefault()!,
                                       Project = context.Projects
                                           .Where(p => p.Id.Equals(ticket.ProjectId))
                                           .Select(project => new ProjectForTicketDto
                                           {
                                               Id = project.Id,
                                               ProjectName = project.ProjectName,
                                           }).SingleOrDefault()!
                                   }).ToList();

            var userProjectTickets = (from member in context.ProjectTeamMembers
                                      where member.UserId == userId
                                      join team in context.ProjectTeams on member.ProjectTeamId equals team.Id
                                      join project in context.Projects on team.ProjectId equals project.Id
                                      join ticket in context.Tickets on project.Id equals ticket.ProjectId
                                      select new GetTicketDto
                                      {
                                          Id = ticket.Id,
                                          Name = ticket.Name,
                                          Description = ticket.Description,
                                          Status = ticket.Status,
                                          CreationDate = ticket.CreationDate,
                                          AssignedDate = ticket.AssignedDate,
                                          ResolutionDate = ticket.ResolutionDate,
                                          RequestType = ticket.RequestType,
                                          AssignedUser = context.Users
                                              .Where(u => u.Id.Equals(ticket.AssignedUserId))
                                              .Select(user => new TicketUserDto
                                              {
                                                  Id = user.Id,
                                                  Name = user.Name,
                                                  ImageUrl = user.ImageUrl,
                                                  IsActive = user.IsActive
                                              }).SingleOrDefault(),
                                          CreatorUser = context.Users
                                              .Where(u => u.Id.Equals(ticket.CreatorUserId))
                                              .Select(user => new TicketUserDto
                                              {
                                                  Id = user.Id,
                                                  Name = user.Name,
                                                  ImageUrl = user.ImageUrl,
                                                  IsActive = user.IsActive
                                              }).SingleOrDefault()!,
                                          Customer = context.Customers
                                              .Where(c => c.CustomerId.Equals(ticket.CustomerId))
                                              .Select(customer => new BasicCustomerDto
                                              {
                                                  CustomerId = customer.CustomerId,
                                                  CustomerName = customer.CustomerName
                                              }).SingleOrDefault()!,
                                          Project = context.Projects
                                              .Where(p => p.Id.Equals(ticket.ProjectId))
                                              .Select(project => new ProjectForTicketDto
                                              {
                                                  Id = project.Id,
                                                  ProjectName = project.ProjectName,
                                              }).SingleOrDefault()!
                                      }).ToList();


            var allTickets = customerTickets.Concat(userProjectTickets)
                                .GroupBy(ticket => ticket.Id)
                                .Select(group => group.First())
                                .ToList();

            return allTickets;
        }

        public async Task<IResult> GetPaginatedByCustomerAndUserAsync(long customerId, long userId, int pageNumber, int pageSize)
        {
            using var context = new PortalContext();
            var allTicketsQuery =
                (from ticket in context.Tickets
                 where ticket.CustomerId == customerId ||
                       (from member in context.ProjectTeamMembers
                        where member.UserId == userId
                        join team in context.ProjectTeams on member.ProjectTeamId equals team.Id
                        join project in context.Projects on team.ProjectId equals project.Id
                        select project.Id).Contains(ticket.ProjectId)
                 select new GetTicketDto
                 {
                     Id = ticket.Id,
                     Name = ticket.Name,
                     Description = ticket.Description,
                     Status = ticket.Status,
                     CreationDate = ticket.CreationDate,
                     AssignedDate = ticket.AssignedDate,
                     ResolutionDate = ticket.ResolutionDate,
                     RequestType = ticket.RequestType,
                     AssignedUser = context.Users
                         .Where(u => u.Id == ticket.AssignedUserId)
                         .Select(user => new TicketUserDto
                         {
                             Id = user.Id,
                             Name = user.Name,
                             ImageUrl = user.ImageUrl,
                             IsActive = user.IsActive
                         }).SingleOrDefault(),
                     CreatorUser = context.Users
                         .Where(u => u.Id == ticket.CreatorUserId)
                         .Select(user => new TicketUserDto
                         {
                             Id = user.Id,
                             Name = user.Name,
                             ImageUrl = user.ImageUrl,
                             IsActive = user.IsActive
                         }).SingleOrDefault()!,
                     Customer = context.Customers
                         .Where(c => c.CustomerId == ticket.CustomerId)
                         .Select(customer => new BasicCustomerDto
                         {
                             CustomerId = customer.CustomerId,
                             CustomerName = customer.CustomerName
                         }).SingleOrDefault()!,
                     Project = context.Projects
                         .Where(p => p.Id == ticket.ProjectId)
                         .Select(project => new ProjectForTicketDto
                         {
                             Id = project.Id,
                             ProjectName = project.ProjectName
                         }).SingleOrDefault()!
                 });

            var paginatedTickets = await allTicketsQuery
                .OrderByDescending(t => t.CreationDate)
                .Skip((pageNumber - 1) * pageSize) 
                .Take(pageSize) 
                .ToListAsync();

            return paginatedTickets.Any()
                ? new PaginatedResult<List<GetTicketDto>>(paginatedTickets, true)
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = await allTicketsQuery.CountAsync()
                }
                : new ErrorResult();
        }

        public GetTicketDto GetById(long id)
        {
            using var context = new PortalContext();
            var result = (from ticket in context.Tickets
                          where ticket.Id == id
                          select new GetTicketDto
                          {
                              Id = ticket.Id,
                              Name = ticket.Name,
                              Description = ticket.Description,
                              Status = ticket.Status,
                              CreationDate = ticket.CreationDate,
                              AssignedDate = ticket.AssignedDate,
                              ResolutionDate = ticket.ResolutionDate,
                              RequestType = ticket.RequestType,
                              AssignedUser = context.Users.Where(u => u.Id.Equals(ticket.AssignedUserId)).Select(user => new TicketUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault(),
                              CreatorUser = context.Users.Where(u => u.Id.Equals(ticket.CreatorUserId)).Select(user => new TicketUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault()!,
                              Customer = context.Customers.Where(c => c.CustomerId.Equals(ticket.CustomerId)).Select(customer => new BasicCustomerDto
                              {
                                  CustomerId = customer.CustomerId,
                                  CustomerName = customer.CustomerName
                              }).SingleOrDefault()!,
                              Project = context.Projects.Where(p => p.Id.Equals(ticket.ProjectId)).Select(project => new ProjectForTicketDto
                              {
                                  Id = project.Id,
                                  ProjectName = project.ProjectName,
                              }).SingleOrDefault()!
                          }).SingleOrDefault();

            return result;
        }

        public List<GetTicketDto> GetLastTickets(int ticketCount)
        {
            using var context = new PortalContext();
            var result = (from ticket in context.Tickets
                          orderby ticket.CreationDate descending
                          select new GetTicketDto
                          {
                              Id = ticket.Id,
                              Name = ticket.Name,
                              Description = ticket.Description,
                              Status = ticket.Status,
                              CreationDate = ticket.CreationDate,
                              AssignedDate = ticket.AssignedDate,
                              ResolutionDate = ticket.ResolutionDate,
                              RequestType = ticket.RequestType,
                              AssignedUser = context.Users.Where(u => u.Id.Equals(ticket.AssignedUserId)).Select(user => new TicketUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault(),
                              CreatorUser = context.Users.Where(u => u.Id.Equals(ticket.CreatorUserId)).Select(user => new TicketUserDto
                              {
                                  Id = user.Id,
                                  Name = user.Name,
                                  ImageUrl = user.ImageUrl,
                                  IsActive = user.IsActive
                              }).SingleOrDefault()!,
                              Customer = context.Customers.Where(c => c.CustomerId.Equals(ticket.CustomerId)).Select(customer => new BasicCustomerDto
                              {
                                  CustomerId = customer.CustomerId,
                                  CustomerName = customer.CustomerName
                              }).SingleOrDefault()!,
                              Project = context.Projects.Where(p => p.Id.Equals(ticket.ProjectId)).Select(project => new ProjectForTicketDto
                              {
                                  Id = project.Id,
                                  ProjectName = project.ProjectName,
                              }).SingleOrDefault()!
                          }).Take(ticketCount).ToList();

            return result;
        }

        public List<GetTicketDto> GetLastTicketsByCustomerAndUser(long customerId, long userId, int ticketCount)
        {
            using var context = new PortalContext();
            var customerTickets = (from ticket in context.Tickets
                                   where ticket.CustomerId == customerId
                                   orderby ticket.CreationDate descending
                                   select new GetTicketDto
                                   {
                                       Id = ticket.Id,
                                       Name = ticket.Name,
                                       Description = ticket.Description,
                                       Status = ticket.Status,
                                       CreationDate = ticket.CreationDate,
                                       AssignedDate = ticket.AssignedDate,
                                       ResolutionDate = ticket.ResolutionDate,
                                       RequestType = ticket.RequestType,
                                       AssignedUser = context.Users
                                           .Where(u => u.Id.Equals(ticket.AssignedUserId))
                                           .Select(user => new TicketUserDto
                                           {
                                               Id = user.Id,
                                               Name = user.Name,
                                               ImageUrl = user.ImageUrl,
                                               IsActive = user.IsActive
                                           }).SingleOrDefault(),
                                       CreatorUser = context.Users
                                           .Where(u => u.Id.Equals(ticket.CreatorUserId))
                                           .Select(user => new TicketUserDto
                                           {
                                               Id = user.Id,
                                               Name = user.Name,
                                               ImageUrl = user.ImageUrl,
                                               IsActive = user.IsActive
                                           }).SingleOrDefault()!,
                                       Customer = context.Customers
                                           .Where(c => c.CustomerId.Equals(ticket.CustomerId))
                                           .Select(customer => new BasicCustomerDto
                                           {
                                               CustomerId = customer.CustomerId,
                                               CustomerName = customer.CustomerName
                                           }).SingleOrDefault()!,
                                       Project = context.Projects
                                           .Where(p => p.Id.Equals(ticket.ProjectId))
                                           .Select(project => new ProjectForTicketDto
                                           {
                                               Id = project.Id,
                                               ProjectName = project.ProjectName,
                                           }).SingleOrDefault()!
                                   }).Take(ticketCount).ToList();

            var userProjectTickets = (from member in context.ProjectTeamMembers
                                      where member.UserId == userId
                                      join team in context.ProjectTeams on member.ProjectTeamId equals team.Id
                                      join project in context.Projects on team.ProjectId equals project.Id
                                      join ticket in context.Tickets on project.Id equals ticket.ProjectId
                                      orderby ticket.CreationDate descending
                                      select new GetTicketDto
                                      {
                                          Id = ticket.Id,
                                          Name = ticket.Name,
                                          Description = ticket.Description,
                                          Status = ticket.Status,
                                          CreationDate = ticket.CreationDate,
                                          AssignedDate = ticket.AssignedDate,
                                          ResolutionDate = ticket.ResolutionDate,
                                          RequestType = ticket.RequestType,
                                          AssignedUser = context.Users
                                              .Where(u => u.Id.Equals(ticket.AssignedUserId))
                                              .Select(user => new TicketUserDto
                                              {
                                                  Id = user.Id,
                                                  Name = user.Name,
                                                  ImageUrl = user.ImageUrl,
                                                  IsActive = user.IsActive
                                              }).SingleOrDefault(),
                                          CreatorUser = context.Users
                                              .Where(u => u.Id.Equals(ticket.CreatorUserId))
                                              .Select(user => new TicketUserDto
                                              {
                                                  Id = user.Id,
                                                  Name = user.Name,
                                                  ImageUrl = user.ImageUrl,
                                                  IsActive = user.IsActive
                                              }).SingleOrDefault()!,
                                          Customer = context.Customers
                                              .Where(c => c.CustomerId.Equals(ticket.CustomerId))
                                              .Select(customer => new BasicCustomerDto
                                              {
                                                  CustomerId = customer.CustomerId,
                                                  CustomerName = customer.CustomerName
                                              }).SingleOrDefault()!,
                                          Project = context.Projects
                                              .Where(p => p.Id.Equals(ticket.ProjectId))
                                              .Select(project => new ProjectForTicketDto
                                              {
                                                  Id = project.Id,
                                                  ProjectName = project.ProjectName,
                                              }).SingleOrDefault()!
                                      }).Take(ticketCount).ToList();

            var allTickets = customerTickets.Concat(userProjectTickets)
                                             .GroupBy(ticket => ticket.Id)
                                             .Select(group => group.First())
                                             .OrderByDescending(ticket => ticket.CreationDate)
                                             .Take(ticketCount)
                                             .ToList();

            return allTickets;
        }

        public TicketCountDto GetTicketCount()
        {
            using var context = new PortalContext();
            var tickets = context.Tickets;
            var result = new TicketCountDto
            {
                TotalCount = tickets.Count(),
                NewRequestCount = tickets.Where(t => t.Status.Equals(TicketStatus.New_Request)).Count(),
                InProgressCount = tickets.Where(t => t.Status.Equals(TicketStatus.Assigned)).Count(),
                CompletedCount = tickets.Where(t => t.Status.Equals(TicketStatus.Resolved)).Count(),
            };
            return result;
        }

        public TicketCountDto GetTicketCountByCustomerAndUser(long customerId, long userId)
        {
            using var context = new PortalContext();
            var customerTickets = context.Tickets.Where(t => t.CustomerId.Equals(customerId));

            var userProjectTickets = from member in context.ProjectTeamMembers
                                     where member.UserId == userId
                                     join team in context.ProjectTeams on member.ProjectTeamId equals team.Id
                                     join project in context.Projects on team.ProjectId equals project.Id
                                     join ticket in context.Tickets on project.Id equals ticket.ProjectId
                                     select ticket;


            var allTickets = customerTickets
                             .Concat(userProjectTickets)
                             .GroupBy(t => t.Id)
                             .Select(group => group.First());

            var result = new TicketCountDto
            {
                TotalCount = allTickets.Count(),
                NewRequestCount = allTickets.Where(t => t.Status.Equals(TicketStatus.New_Request)).Count(),
                InProgressCount = allTickets.Where(t => t.Status.Equals(TicketStatus.Assigned)).Count(),
                CompletedCount = allTickets.Where(t => t.Status.Equals(TicketStatus.Resolved)).Count(),
            };

            return result;
        }
    }
}
