using Autofac;
using Autofac.Extras.DynamicProxy;
using Business.Authentication;
using Business.File;
using Business.Helpers;
using Business.ReceiptVision;
using Business.Helpers.DebitHelpers;
using Business.Helpers.PermissionPdfGenerators;
using Business.LogTools;
using Business.MessageBrokers.MassTransit.RabbitMQ.Publishers;
using Business.Repository.AgreementRepository;
using Business.Repository.DepartmentRepository;
using Business.Repository.NewsCategoryRepository;
using Business.Repository.NewsRepository;
using Business.Repository.NewsCommentRepository;
using Business.Repository.AnnouncementRepository;
using Business.Repository.PollRepository;
using DataAccess.Repository.DepartmentRepository;
using DataAccess.Repository.NewsCategoryRepository;
using DataAccess.Repository.NewsRepository;
using DataAccess.Repository.NewsCommentRepository;
using DataAccess.Repository.AnnouncementRepository;
using DataAccess.Repository.PollRepository;
using DataAccess.Repository.PollOptionRepository;
using DataAccess.Repository.PollQuestionRepository;
using DataAccess.Repository.PollVoteRepository;
using Business.Repository.BoardCategoryRepository;
using Business.Repository.BoardMemberRepository;
using Business.Repository.BoardRepository;
using Business.Repository.AiTaskPreviewRepository;
using Business.Repository.CommentReplyRepository;
using Business.Repository.CustomerRepository;
using Business.Repository.CvUserImportRepository;
using Business.Repository.CustomRepository;
using Business.Repository.DaysWorkRepository;
using Business.Repository.DebitRepository;
using Business.Repository.DebitRequestRepository;
using Business.Repository.DocumentRepository;
using Business.Repository.EmergencyContactRepository;
using Business.Repository.ExpenseCategoryRepository;
using Business.Repository.ExpenseRepository;
using Business.Repository.ExpenseSettingsRepository;
using Business.Repository.ForgotPasswordRepository;
using Business.Repository.HealthInfoRepository;
using Business.Repository.HolidayRepository;
using Business.Repository.LabelRepository;
using Business.Repository.LeaveDeducationRepository;
using Business.Repository.LogRepository;
using Business.Repository.MailRepository;
using Business.Repository.MailTemplatesRepository;
using Business.Repository.NoteRepository;
using Business.Repository.NotificationRepository;
using Business.Repository.OperationClaimRepository;
using Business.Repository.PermissionRepository;
using Business.Repository.PermissionTypeRepository;
using Business.Repository.ProductRepository;
using Business.Repository.ProjectRepository;
using Business.Repository.ProjectTeamMemberRepository;
using Business.Repository.ProjectTeamRepository;
using Business.Repository.ProjectTypeRepository;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.RequestRepository;
using Business.Repository.TaskAttachmentRepository;
using Business.Repository.TaskCommentRepository;
using Business.Repository.TaskLabelRepository;
using Business.Repository.TaskListRepository;
using Business.Repository.TaskMemberRepository;
using Business.Repository.TaskRepository;
using Business.Repository.TaskTodoListRepository;
using Business.Repository.TaskTodoRepository;
using Business.Repository.TicketAttachmentRepository;
using Business.Repository.TicketCommentRepository;
using Business.Repository.TicketEffortRepository;
using Business.Repository.TicketRepository;
using Business.Repository.UserCertificateDetailRepository;
using Business.Repository.UserCustomerRepository;
using Business.Repository.UserEducationDetailRepository;
using Business.Repository.UserFamilyDetailRepository;
using Business.Repository.UserJobDetailsRepository;
using Business.Repository.UserJobExperienceRepository;
using Business.Repository.UserLanguageDetailRepository;
using Business.Repository.UserOperationClaimRepository;
using Business.Repository.UserPermissionRepository;
using Business.Repository.UserProfileDetailRepository;
using Business.Repository.UserRepository;
using Business.Repository.UserRoleRepository;
using Castle.DynamicProxy;
using Core.CrossCuttingConcerns.Caching;
using Core.CrossCuttingConcerns.Caching.Microsoft;
using Core.Identity;
using Core.Utilities.Interceptors;
using Core.Utilities.Security.JWT;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.AiTaskPreviewRepository;
using DataAccess.Repository.AgreementRepository;
using DataAccess.Repository.CommentReplyRepository;
using DataAccess.Repository.CustomerRepository;
using DataAccess.Repository.CustomRepository;
using DataAccess.Repository.DaysWorkRepository;
using DataAccess.Repository.DebitRepository;
using DataAccess.Repository.DebitRequestRepository;
using DataAccess.Repository.DocumentRepository;
using DataAccess.Repository.EmergencyContactRepository;
using DataAccess.Repository.ExpenseCategoryRepository;
using DataAccess.Repository.ExpenseIncompleteDraftRepository;
using DataAccess.Repository.ExpenseDraftSnapshotRepository;
using DataAccess.Repository.ExpenseRepository;
using DataAccess.Repository.ExpenseSettingsRepository;
using DataAccess.Repository.ForgotPasswordRepository;
using DataAccess.Repository.HealthInfoRepository;
using DataAccess.Repository.HolidayRepository;
using DataAccess.Repository.LabelRepository;
using DataAccess.Repository.LeaveDeducationRepository;
using DataAccess.Repository.LogRepository;
using DataAccess.Repository.LogRepositroy;
using DataAccess.Repository.FolderRepository;
using DataAccess.Repository.MailRepository;
using DataAccess.Repository.NoteRepository;
using DataAccess.Repository.NoteTagRepository;
using DataAccess.Repository.NoteShareRepository;
using DataAccess.Repository.NotificationRepository;
using DataAccess.Repository.TagRepository;
using DataAccess.Repository.OperationClaimRepository;
using DataAccess.Repository.PermissionRepository;
using DataAccess.Repository.PermissionTypeRepository;
using DataAccess.Repository.ProductRepository;
using DataAccess.Repository.ProjectRepository;
using DataAccess.Repository.ProjectTeamMemberRepository;
using DataAccess.Repository.ProjectTeamRepository;
using DataAccess.Repository.ProjectTypeRepository;
using DataAccess.Repository.RolesForUsersRepository;
using DataAccess.Repository.RequestRepository;
using DataAccess.Repository.TaskListRepository;
using DataAccess.Repository.TaskRepository;
using DataAccess.Repository.TicketAttachmentRepository;
using DataAccess.Repository.TicketCommentRepository;
using DataAccess.Repository.TicketEffortRepository;
using DataAccess.Repository.TicketRepository;
using DataAccess.Repository.UserCertificateDetailRepository;
using DataAccess.Repository.UserAgreementRepository;
using DataAccess.Repository.UserCustomerRepository;
using DataAccess.Repository.UserEducationDetailRepository;
using DataAccess.Repository.UserFamilyDetailRepository;
using DataAccess.Repository.UserJobDetailRepository;
using DataAccess.Repository.UserJobExperienceRepository;
using DataAccess.Repository.UserLanguageDetailRepository;
using DataAccess.Repository.UserOperationClaimRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserProfileDetailRepository;
using DataAccess.Repository.UserRepository;
using DataAccess.Repository.UserRoleRepository;
using Microsoft.AspNetCore.Http;

namespace Business.DependencyResolves.AutoFac
{
    public class AutoFacBusinessModule : Module
    {
        protected override void Load(ContainerBuilder builder)
        {

            builder.RegisterType<MemoryCacheManager>().As<ICacheManager>();
            builder.RegisterType<HttpContextAccessor>().As<IHttpContextAccessor>();
            builder.RegisterType<UserContext>().As<IUserContext>();

            builder.RegisterType<TicketTagPublisher>();

            builder.RegisterType<TokenHandler>().As<ITokenHandler>();

            builder.RegisterType<FileManager>().As<IFileService>();
            builder.RegisterType<ServiceKeyValidator>().As<IServiceKeyValidator>();

            builder.RegisterType<GetDebitPDFPath>();
            builder.RegisterType<PermissionHelpers>();
            
            // ✅ EKLENDİ: İzin PDF Oluşturucu Servisi
            builder.RegisterType<PermissionPdfGenerator>().SingleInstance();

            builder.RegisterType<OperationClaimManager>().As<IOperationClaimService>();
            builder.RegisterType<EfOperationClaimDal>().As<IOperationClaimDal>();

            builder.RegisterType<UserManager>().As<IUserService>();
            builder.RegisterType<EfUserDal>().As<IUserDal>();

            builder.RegisterType<DebitManager>().As<IDebitService>();
            builder.RegisterType<EfDebitDal>().As<IDebitDal>();

            builder.RegisterType<DebitRequestManager>().As<IDebitRequestService>();
            builder.RegisterType<EfDebitRequestDal>().As<IDebitRequestDal>();

            builder.RegisterType<ProductManager>().As<IProductService>();
            builder.RegisterType<EfProductDal>().As<IProductDal>();

            builder.RegisterType<UserOperationClaimManager>().As<IUserOperationClaimService>();
            builder.RegisterType<EfUserOperationClaimDal>().As<IUserOperationClaimDal>();

            builder.RegisterType<MailParameterManager>().As<IMailParameterService>();
            builder.RegisterType<EfMailParameterDal>().As<IMailParameterDal>();

            builder.RegisterType<MailManager>().As<IMailService>();
            builder.RegisterType<EfMailDal>().As<IMailDal>();

            builder.RegisterType<MailTemplatesManager>().As<IMailTemplatesService>();
            builder.RegisterType<EfMailTemplatesDal>().As<IMailTemplatesDal>();

            builder.RegisterType<AgreementManager>().As<IAgreementService>();
            builder.RegisterType<EfAgreementDal>().As<IAgreementDal>();
            builder.RegisterType<EfUserAgreementDal>().As<IUserAgreementDal>();

            builder.RegisterType<NotificationManager>().As<INotificationService>();
            builder.RegisterType<EfNotificationDal>().As<INotificationDal>();

            builder.RegisterType<EfNoteDal>().As<INoteDal>();
            builder.RegisterType<EfFolderDal>().As<IFolderDal>();
            builder.RegisterType<EfTagDal>().As<ITagDal>();
            builder.RegisterType<EfNoteTagDal>().As<INoteTagDal>();
            builder.RegisterType<EfNoteShareDal>().As<INoteShareDal>();
            builder.RegisterType<NotesAppService>().As<INotesAppService>();

            builder.RegisterType<ProjectManager>().As<IProjectService>();
            builder.RegisterType<EfProjectDal>().As<IProjectDal>();

            builder.RegisterType<ProjectTypeManager>().As<IProjectTypeService>();
            builder.RegisterType<EfProjectTypeDal>().As<IProjectTypeDal>();

            builder.RegisterType<ProjectTeamManager>().As<IProjectTeamService>();
            builder.RegisterType<EfProjectTeamDal>().As<IProjectTeamDal>();

            builder.RegisterType<ProjectTeamMemberManager>().As<IProjectTeamMemberService>();
            builder.RegisterType<EfProjectTeamMemberDal>().As<IProjectTeamMemberDal>();

            builder.RegisterType<TicketAttachmentManager>().As<ITicketAttachmentService>();
            builder.RegisterType<EfTicketAttachmentDal>().As<ITicketAttachmentDal>();

            builder.RegisterType<TicketManager>().As<ITicketService>();
            builder.RegisterType<EfTicketDal>().As<ITicketDal>();

            builder.RegisterType<TicketCommentManager>().As<ITicketCommentService>();
            builder.RegisterType<EfTicketCommentDal>().As<ITicketCommentDal>();

            builder.RegisterType<TicketCommentReplyManager>().As<ITicketCommentReplyService>();
            builder.RegisterType<EfTicketCommentReplyDal>().As<ITicketCommentReplyDal>();

            builder.RegisterType<TicketEffortManager>().As<ITicketEffortService>();
            builder.RegisterType<EfTicketEffortDal>().As<ITicketEffortDal>();

            builder.RegisterType<CustomerManager>().As<ICustomerService>();
            builder.RegisterType<EfCustomerDal>().As<ICustomerDal>();

            builder.RegisterType<UserCustomerManager>().As<IUserCustomerService>();
            builder.RegisterType<EfUserCustomerDal>().As<IUserCustomerDal>();

            builder.RegisterType<ForgotPasswordManager>().As<IForgotPasswordService>();
            builder.RegisterType<EfForgotPasswordDal>().As<IForgotPasswordDal>();

            builder.RegisterType<AuthManager>().As<IAuthService>();

            builder.RegisterType<EfBoardDal>().As<IBoardDal>();
            builder.RegisterType<BoardManager>().As<IBoardService>();

            builder.RegisterType<EfAiTaskPreviewDal>().As<IAiTaskPreviewDal>();
            builder.RegisterType<AiTaskPreviewManager>().As<IAiTaskPreviewService>();
            builder.RegisterType<CvParserHttpClient>().As<ICvParserClient>();
            builder.RegisterType<CvUserImportManager>().As<ICvUserImportService>();

            builder.RegisterType<EfBoardCategoryDal>().As<IBoardCategoryDal>();
            builder.RegisterType<BoardCategoryManager>().As<IBoardCategoryService>();

            builder.RegisterType<EfBoardMemberDal>().As<IBoardMemberDal>();
            builder.RegisterType<BoardMemberManager>().As<IBoardMemberService>();

            builder.RegisterType<EfLabelDal>().As<ILabelDal>();
            builder.RegisterType<LabelManager>().As<ILabelService>();

            builder.RegisterType<EfTaskListDal>().As<ITaskListDal>();
            builder.RegisterType<TaskListManager>().As<ITaskListService>();

            builder.RegisterType<EfTaskDal>().As<ITaskDal>();
            builder.RegisterType<TaskManager>().As<ITaskService>();

            builder.RegisterType<EfTaskCommentDal>().As<ITaskCommentDal>();
            builder.RegisterType<TaskCommentManager>().As<ITaskCommentService>();

            builder.RegisterType<EfTaskAttachmentDal>().As<ITaskAttachmentDal>();
            builder.RegisterType<TaskAttachmentManager>().As<ITaskAttachmentService>();

            builder.RegisterType<EfTaskLabelDal>().As<ITaskLabelDal>();
            builder.RegisterType<TaskLabelManager>().As<ITaskLabelService>();

            builder.RegisterType<EfTaskMemberDal>().As<ITaskMemberDal>();
            builder.RegisterType<TaskMemberManager>().As<ITaskMemberService>();

            builder.RegisterType<EfTaskTodoListDal>().As<ITaskTodoListDal>();
            builder.RegisterType<TaskTodoListManager>().As<ITaskTodoListService>();

            builder.RegisterType<EfTaskTodoDal>().As<ITaskTodoDal>();
            builder.RegisterType<TaskTodoManager>().As<ITaskTodoService>();

            builder.RegisterType<EfPermissionDal>().As<IPermissionDal>();
            builder.RegisterType<PermissionManager>().As<IPermissionService>();

            builder.RegisterType<EfPermissionTypeDal>().As<IPermissionTypeDal>();
            builder.RegisterType<PermissionTypeManager>().As<IPermissionTypeService>();

            builder.RegisterType<EfUserPermissionDal>().As<IUserPermissionDal>();
            builder.RegisterType<UserPermissionManager>().As<IUserPermissionService>();

            builder.RegisterType<EfHolidayDal>().As<IHolidayDal>();
            builder.RegisterType<HolidayManager>().As<IHolidayService>();

            builder.RegisterType<EfLeaveDeducationDal>().As<ILeaveDeducationDal>();
            builder.RegisterType<LeaveDeducationManager>().As<ILeaveDeducationService>();

            builder.RegisterType<EfCustomDal>().As<ICustomDal>();
            builder.RegisterType<CustomManager>().As<ICustomService>();

            builder.RegisterType<EfDaysWorkDal>().As<IDaysWorkDal>();
            builder.RegisterType<DaysWorkManager>().As<IDaysWorkService>();

            builder.RegisterType<EfUserJobDetailDal>().As<IUserJobDetailDal>();
            builder.RegisterType<UserJobDetailManager>().As<IUserJobDetailService>();

            builder.RegisterType<EfUserJobExperienceDal>().As<IUserJobExperienceDal>();
            builder.RegisterType<UserJobExperienceManager>().As<IUserJobExperienceService>();

            builder.RegisterType<EfUserProfileDetailDal>().As<IUserProfileDetailDal>();
            builder.RegisterType<UserProfileDetailsManager>().As<IUserProfileDetailService>();

            builder.RegisterType<EfUserLanguageDetailDal>().As<IUserLanguageDetailDal>();
            builder.RegisterType<UserLanguageDetailManager>().As<IUserLanguageDetailService>();

            builder.RegisterType<EfUserFamilyDetailDal>().As<IUserFamilyDetailDal>();
            builder.RegisterType<UserFamilyDetailManager>().As<IUserFamilyDetailService>();

            builder.RegisterType<EfUserEducationDetailDal>().As<IUserEducationDetailDal>();
            builder.RegisterType<UserEducationDetailManager>().As<IUserEducationDetailService>();

            builder.RegisterType<EfUserCertificateDetailDal>().As<IUserCertificateDetailDal>();
            builder.RegisterType<UserCertificateDetailManager>().As<IUserCertificateDetailService>();

            builder.RegisterType<EfUserRoleDal>().As<IUserRoleDal>();
            builder.RegisterType<UserRoleManager>().As<IUserRoleService>();

            builder.RegisterType<EfRolesForUsersDal>().As<IRolesForUsersDal>();
            builder.RegisterType<RolesForUsersManager>().As<IRolesForUsersService>();

            builder.RegisterType<EfExpenseDal>().As<IExpenseDal>();
            builder.RegisterType<EfExpenseItemDal>().As<IExpenseItemDal>();
            builder.RegisterType<EfExpenseIncompleteDraftDal>().As<IExpenseIncompleteDraftDal>();
            builder.RegisterType<EfExpenseDraftSnapshotDal>().As<IExpenseDraftSnapshotDal>();
            builder.RegisterType<ExpenseManager>().As<IExpenseService>();
            builder.RegisterType<SmtpMailParametersProvider>().As<ISmtpMailParametersProvider>().InstancePerLifetimeScope();
            builder.RegisterType<ExpenseReminderRunner>().As<IExpenseReminderRunner>().InstancePerLifetimeScope();

            builder.RegisterType<EfExpenseSettingsDal>().As<IExpenseSettingsDal>();
            builder.RegisterType<ExpenseSettingsManager>().As<IExpenseSettingsService>();

            builder.RegisterType<EfExpenseCategoryDal>().As<IExpenseCategoryDal>();
            builder.RegisterType<ExpenseCategoryManager>().As<IExpenseCategoryService>();

            // Talep Yönetimi
            builder.RegisterType<EfRequestCategoryDal>().As<IRequestCategoryDal>();
            builder.RegisterType<EfRequestSubCategoryDal>().As<IRequestSubCategoryDal>();
            builder.RegisterType<EfRequestSubCategoryFieldDal>().As<IRequestSubCategoryFieldDal>();
            builder.RegisterType<EfRequestDal>().As<IRequestDal>();
            builder.RegisterType<EfRequestStatusHistoryDal>().As<IRequestStatusHistoryDal>();
            builder.RegisterType<EfRequestAttachmentDal>().As<IRequestAttachmentDal>();
            builder.RegisterType<RequestManager>().As<IRequestService>();

            builder.RegisterType<EfDocumentDal>().As<IDocumentDal>();
            builder.RegisterType<DocumentManager>().As<IDocumentService>();

            builder.RegisterType<EfHealthInfoDal>().As<IHealthInfoDal>();
            builder.RegisterType<HealthInfoManager>().As<IHealthInfoService>();

            builder.RegisterType<EfEmergencyContactDal>().As<IEmergencyContactDal>();
            builder.RegisterType<EmergencyContactManager>().As<IEmergencyContactService>();

            builder.RegisterType<EfSessionDal>().As<ISessionDal>();
            builder.RegisterType<EfErrorTypeDal>().As<IErrorTypeDal>();
            builder.RegisterType<EfErrorDal>().As<IErrorDal>();
            builder.RegisterType<EfErrorMessageDal>().As<IErrorMessageDal>();
            builder.RegisterType<EfStackTraceDal>().As<IStackTraceDal>();
            builder.RegisterType<EfRequestUrlDal>().As<IRequestUrlDal>();
            builder.RegisterType<EfUserActivityDal>().As<IUserActivityDal>();

            builder.RegisterType<SessionTool>().As<ISessionProvider>();
            builder.RegisterType<UserActivityTool>().As<IUserActivityProvider>();
            builder.RegisterType<ExceptionTool>().As<IExceptionProvider>();

            builder.RegisterType<ErrorManager>().As<IErrorService>();
            builder.RegisterType<UserActivityManager>().As<IUserActivityService>();
            builder.RegisterType<SessionManager>().As<ISessionService>();

            // --- Portal News / Announcement / Poll Modülleri ---
            builder.RegisterType<EfDepartmentDal>().As<IDepartmentDal>();
            builder.RegisterType<DepartmentManager>().As<IDepartmentService>();

            builder.RegisterType<EfNewsCategoryDal>().As<INewsCategoryDal>();
            builder.RegisterType<NewsCategoryManager>().As<INewsCategoryService>();

            builder.RegisterType<EfNewsDal>().As<INewsDal>();
            builder.RegisterType<NewsManager>().As<INewsService>();

            builder.RegisterType<EfNewsCommentDal>().As<INewsCommentDal>();
            builder.RegisterType<NewsCommentManager>().As<INewsCommentService>();

            builder.RegisterType<EfAnnouncementDal>().As<IAnnouncementDal>();
            builder.RegisterType<AnnouncementManager>().As<IAnnouncementService>();

            builder.RegisterType<EfPollDal>().As<IPollDal>();
            builder.RegisterType<EfPollQuestionDal>().As<IPollQuestionDal>();
            builder.RegisterType<EfPollOptionDal>().As<IPollOptionDal>();
            builder.RegisterType<EfPollVoteDal>().As<IPollVoteDal>();
            builder.RegisterType<PollManager>().As<IPollService>();

            var assembly = System.Reflection.Assembly.GetExecutingAssembly();
            builder.RegisterAssemblyTypes(assembly)
                .Where(t => t.Namespace == null || !t.Namespace.StartsWith("Business.ReceiptVision", StringComparison.Ordinal))
                .AsImplementedInterfaces().EnableInterfaceInterceptors(new ProxyGenerationOptions()
            {
                Selector = new AspectInterceptorSelector()
            }).InstancePerLifetimeScope();

            // OpenAI çağrısı + IHttpClientFactory: tek örnek yerine istek başına ömür (HttpClient factory deseni).
            builder.RegisterType<ExpenseReceiptExtractionManager>().As<IExpenseReceiptExtractionService>().InstancePerLifetimeScope();

            builder.RegisterType<GroqReceiptVisionService>().As<IReceiptVisionService>().InstancePerLifetimeScope();

        }
    }
}
