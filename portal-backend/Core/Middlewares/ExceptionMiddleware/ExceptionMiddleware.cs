using Core.Utilities.Exceptions;
using Core.Utilities.Results.Concrete;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;

namespace Core.Middlewares.ExceptionMiddleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        //static readonly ILogger Log = Serilog.Log.ForContext<ExceptionMiddleware>();
        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext httpContext, Exception ex)
        {

            httpContext.Response.ContentType = "application/json";
            httpContext.Response.StatusCode = ex switch
            {
                UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
                ForbiddenAccessException => (int)HttpStatusCode.Forbidden,
                ValidationException => (int)HttpStatusCode.BadRequest,
                BadRequestException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };
            //var now = DateTime.UtcNow;
            //Log.Error($"{now.ToString("HH:mm:ss")} : {ex}");
            var result = new ExceptionResult()
            {
                StatusCode = httpContext.Response.StatusCode,
                Message = ex.Message
            };

            var json = JsonSerializer.Serialize(result);

            return httpContext.Response.WriteAsync(json);
        }
    }
}
