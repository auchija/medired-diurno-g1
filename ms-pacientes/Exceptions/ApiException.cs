namespace ms_pacientes.Exceptions;

public sealed class ApiException : Exception
{
    public int StatusCode { get; }
    public object? Details { get; }

    public ApiException(int statusCode, string message, object? details = null)
        : base(message)
    {
        StatusCode = statusCode;
        Details = details;
    }
    public ApiException() : this(500, "Ha ocurrido un error de API.") { }

    public ApiException(string message)
        : this(500, message) { }

    public ApiException(string message, Exception innerException)
        : base(message, innerException)
    {
        StatusCode = 500;
    }
}
