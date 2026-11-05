using MySqlConnector;

namespace ms_pacientes.Infrastructure.Database;

public interface IMySqlConnectionFactory
{
    MySqlConnection CreateConnection();
}