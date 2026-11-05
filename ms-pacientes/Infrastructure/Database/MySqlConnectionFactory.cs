using MySqlConnector;

namespace ms_pacientes.Infrastructure.Database;

public sealed class MySqlConnectionFactory : IMySqlConnectionFactory
{
    private readonly string _connectionString;

    public MySqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("Pacientes")
            ?? throw new InvalidOperationException(
                "No se encontró la cadena de conexión 'Pacientes'.");
    }

    public MySqlConnection CreateConnection()
    {
        return new MySqlConnection(_connectionString);
    }
}