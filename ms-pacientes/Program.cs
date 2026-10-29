/*
using ms_pacientes.Repositories;
En ASP.NET Core Program.cs lee PORT y HOST desde el archivo appsettings.json y usa el valor de estas propiedades para configurar el servidor HTTP.
El archivo appsettings.json debe estar ubicado en la raíz del proyecto, es el equivalente a el archivo .env en Node.js.

Este mismo archivo configura el pipeline de middleware de ASP.NET Core, incluyendo el middleware de autenticación y autorización, el middleware de manejo de errores, etc.
*/

using Microsoft.AspNetCore.Mvc;
using ms_pacientes.Exceptions;
using ms_pacientes.Repositories;
using ms_pacientes.Services;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Leer Host y Port desde appsettings.json.
var host = builder.Configuration["Host"] ?? "127.0.0.1";
var port = builder.Configuration.GetValue<int?>("Port") ?? 3000;

builder.WebHost.UseUrls($"http://{host}:{port}");

// Controladores y formato de los errores de validación del modelo.
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            JsonNamingPolicy.SnakeCaseLower;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
            new BadRequestObjectResult(new
            {
                error = "La solicitud no es válida",
                detalles = context.ModelState
                    .Where(entry => entry.Value?.Errors.Count > 0)
                    .ToDictionary(
                        entry => entry.Key,
                        entry => entry.Value!.Errors
                            .Select(error => error.ErrorMessage)
                            .ToArray())
            });
    });

// Inyección de dependencias.
builder.Services.AddSingleton<IPacientesRepository, PacientesRepository>();
builder.Services.AddScoped<IPacientesService, PacientesService>();

var app = builder.Build();

// Capturar excepciones no controladas y responder en JSON.
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error no controlado");

        if (context.Response.HasStarted)
            throw;

        context.Response.Clear();
        context.Response.ContentType = "application/json";

        var statusCode = ex is ApiException apiException
            ? apiException.StatusCode
            : StatusCodes.Status500InternalServerError;

        context.Response.StatusCode = statusCode;

        var error = new Dictionary<string, object?>
        {
            ["error"] = statusCode == StatusCodes.Status500InternalServerError
                ? "Error interno del servidor"
                : ex.Message
        };

        if (ex is ApiException { Details: not null } apiError)
            error["detalles"] = apiError.Details;

        await context.Response.WriteAsJsonAsync(error);
    }
});

// Respuesta JSON para rutas inexistentes.
app.UseStatusCodePages(async statusCodeContext =>
{
    var context = statusCodeContext.HttpContext;

    if (context.Response.StatusCode == StatusCodes.Status404NotFound)
    {
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            error = $"Ruta no encontrada: {context.Request.Method} " +
                    $"{context.Request.Path}{context.Request.QueryString}"
        });
    }
});

// Endpoint de salud.
app.MapGet("/health", () => Results.Ok(new
{
    servicio = "ms-pacientes",
    estado = "ok"
}));

// Rutas de los controladores.
app.MapControllers();

app.Run();
