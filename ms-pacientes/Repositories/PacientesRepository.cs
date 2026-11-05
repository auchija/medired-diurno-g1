
using ms_pacientes.Models;
using ms_pacientes.Infrastructure.Database;
using MySqlConnector;

namespace ms_pacientes.Repositories;

public sealed class PacientesRepository : IPacientesRepository
{
    private readonly IMySqlConnectionFactory _connectionFactory;

    public PacientesRepository(IMySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Convierte una fila de MySQL en una entidad Paciente.
    private static Paciente MapPaciente(MySqlDataReader reader)
    {
        return new Paciente
        {
            Id = reader.GetInt32("id"),
            Nombre = reader.GetString("nombre"),
            Documento = reader.GetString("documento"),
            FechaNacimiento = DateOnly.FromDateTime(
                reader.GetDateTime("fecha_nacimiento")),
            Eps = reader.GetString("eps"),
            Telefono = reader.GetString("telefono")
        };
    }

    // Obtiene todos los pacientes.
    public async Task<List<Paciente>> FindAllAsync()
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id, nombre, documento, fecha_nacimiento, eps, telefono
            FROM pacientes
            ORDER BY id;
            """;

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();

        var pacientes = new List<Paciente>();

        while (await reader.ReadAsync())
        {
            pacientes.Add(MapPaciente(reader));
        }

        return pacientes;
    }

    // Obtiene pacientes cuyos IDs estén dentro de la colección.
    public async Task<IReadOnlyList<Paciente>> FindByIdsAsync(
        IReadOnlyCollection<int> ids)
    {
        if (ids.Count == 0)
            return Array.Empty<Paciente>();

        var idsUnicos = ids.Distinct().ToList();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        var parameterNames = idsUnicos
            .Select((_, index) => $"@id{index}")
            .ToList();

        var sql = $"""
            SELECT id, nombre, documento, fecha_nacimiento, eps, telefono
            FROM pacientes
            WHERE id IN ({string.Join(", ", parameterNames)})
            ORDER BY id;
            """;

        await using var command = new MySqlCommand(sql, connection);

        for (var i = 0; i < idsUnicos.Count; i++)
        {
            command.Parameters.AddWithValue(parameterNames[i], idsUnicos[i]);
        }

        await using var reader = await command.ExecuteReaderAsync();

        var pacientes = new List<Paciente>();

        while (await reader.ReadAsync())
        {
            pacientes.Add(MapPaciente(reader));
        }

        return pacientes;
    }

    // Busca un paciente por su ID.
    public async Task<Paciente?> FindByIdAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id, nombre, documento, fecha_nacimiento, eps, telefono
            FROM pacientes
            WHERE id = @id;
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);

        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return MapPaciente(reader);

        return null;
    }

    // Busca un paciente por su documento.
    public async Task<Paciente?> FindByDocumentAsync(string documento)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id, nombre, documento, fecha_nacimiento, eps, telefono
            FROM pacientes
            WHERE documento = @documento;
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@documento", documento);

        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return MapPaciente(reader);

        return null;
    }

    // Registra un paciente nuevo.
    public async Task<Paciente> CreateAsync(Paciente paciente)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            INSERT INTO pacientes
                (nombre, documento, fecha_nacimiento, eps, telefono)
            VALUES
                (@nombre, @documento, @fechaNacimiento, @eps, @telefono);
            """;

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@nombre", paciente.Nombre);
        command.Parameters.AddWithValue("@documento", paciente.Documento);
        command.Parameters.AddWithValue(
            "@fechaNacimiento",
            paciente.FechaNacimiento.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@eps", paciente.Eps);
        command.Parameters.AddWithValue("@telefono", paciente.Telefono);

        await command.ExecuteNonQueryAsync();

        var nuevoId = checked((int)command.LastInsertedId);

        return new Paciente
        {
            Id = nuevoId,
            Nombre = paciente.Nombre,
            Documento = paciente.Documento,
            FechaNacimiento = paciente.FechaNacimiento,
            Eps = paciente.Eps,
            Telefono = paciente.Telefono
        };
    }

    // Actualiza un paciente existente.
    public async Task<Paciente?> UpdateAsync(int id, Paciente paciente)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            UPDATE pacientes
            SET nombre = @nombre,
                documento = @documento,
                fecha_nacimiento = @fechaNacimiento,
                eps = @eps,
                telefono = @telefono
            WHERE id = @id;
            """;

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@nombre", paciente.Nombre);
        command.Parameters.AddWithValue("@documento", paciente.Documento);
        command.Parameters.AddWithValue(
            "@fechaNacimiento",
            paciente.FechaNacimiento.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@eps", paciente.Eps);
        command.Parameters.AddWithValue("@telefono", paciente.Telefono);
        command.Parameters.AddWithValue("@id", id);

        await command.ExecuteNonQueryAsync();

        // Consultamos nuevamente para comprobar que el paciente existe
        // y devolver los datos persistidos, incluso si no hubo cambios.
        const string selectSql = """
            SELECT id, nombre, documento, fecha_nacimiento, eps, telefono
            FROM pacientes
            WHERE id = @id;
            """;

        await using var selectCommand = new MySqlCommand(selectSql, connection);
        selectCommand.Parameters.AddWithValue("@id", id);

        await using var reader = await selectCommand.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return MapPaciente(reader);

        return null;
    }

    // Elimina un paciente por su ID.
    public async Task<bool> RemoveAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            DELETE FROM pacientes
            WHERE id = @id;
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);

        var rowsAffected = await command.ExecuteNonQueryAsync();

        return rowsAffected > 0;
    }
}
