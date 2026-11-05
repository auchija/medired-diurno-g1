using MySqlConnector;

namespace ms_medicos.Infrastructure.Database;

public interface IMySqlConnectionFactory
{
    MySqlConnection CreateConnection();
}