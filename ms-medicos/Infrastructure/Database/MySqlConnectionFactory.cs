using MySqlConnector;

namespace ms_medicos.Infrastructure.Database;

public sealed class MySqlConnectionFactory : IMySqlConnectionFactory
{
    private readonly string _connectionString;

    public MySqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("Medicos")
            ?? throw new InvalidOperationException(
                "No se encontró la cadena de conexión 'Medicos'.");
    }

    public MySqlConnection CreateConnection()
    {
        return new MySqlConnection(_connectionString);
    }
}