
using ms_medicos.Models;
using ms_medicos.Infrastructure.Database;
using MySqlConnector;

namespace ms_medicos.Repositories;

public sealed class MedicosRepository : IMedicosRepository
{
    private readonly IMySqlConnectionFactory _connectionFactory;

    public MedicosRepository(IMySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Convierte una fila de MySQL en una entidad Medico.
    private static Medico MapMedico(MySqlDataReader reader)
    {
        var sedeTexto = reader.GetString("sede");

        if (!Enum.TryParse<Sede>(sedeTexto, true, out var sede))
        {
            throw new InvalidOperationException(
                $"La sede '{sedeTexto}' almacenada en MySQL no es válida.");
        }

        return new Medico
        {
            Id = reader.GetInt32("id"),
            Nombre = reader.GetString("nombre"),
            RegistroMedico = reader.GetString("registro_medico"),
            Especialidad = reader.GetString("especialidad"),
            Sede = sede
        };
    }

    // Obtiene todos los médicos.
    public async Task<List<Medico>> FindAllAsync()
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id, nombre, registro_medico, especialidad, sede
            FROM medicos
            ORDER BY id;
            """;

        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();

        var medicos = new List<Medico>();

        while (await reader.ReadAsync())
        {
            medicos.Add(MapMedico(reader));
        }

        return medicos;
    }

    // Obtiene médicos cuyos IDs estén dentro de la colección.
    public async Task<IReadOnlyList<Medico>> FindByIdsAsync(
        IReadOnlyCollection<int> ids)
    {
        if (ids.Count == 0)
            return Array.Empty<Medico>();

        var idsUnicos = ids.Distinct().ToList();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        var parameterNames = idsUnicos
            .Select((_, index) => $"@id{index}")
            .ToList();

        var sql = $"""
            SELECT id, nombre, registro_medico, especialidad, sede
            FROM medicos
            WHERE id IN ({string.Join(", ", parameterNames)})
            ORDER BY id;
            """;

        await using var command = new MySqlCommand(sql, connection);

        for (var i = 0; i < idsUnicos.Count; i++)
        {
            command.Parameters.AddWithValue(parameterNames[i], idsUnicos[i]);
        }

        await using var reader = await command.ExecuteReaderAsync();

        var medicos = new List<Medico>();

        while (await reader.ReadAsync())
        {
            medicos.Add(MapMedico(reader));
        }

        return medicos;
    }

    // Busca un médico por su ID.
    public async Task<Medico?> FindByIdAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id, nombre, registro_medico, especialidad, sede
            FROM medicos
            WHERE id = @id;
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);

        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return MapMedico(reader);

        return null;
    }

    // Busca un médico por su registro profesional.
    public async Task<Medico?> FindByRegistroMedicoAsync(
        string registroMedico)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            SELECT id, nombre, registro_medico, especialidad, sede
            FROM medicos
            WHERE registro_medico = @registroMedico;
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@registroMedico", registroMedico);

        await using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return MapMedico(reader);

        return null;
    }

    // Obtiene médicos de una especialidad.
    public async Task<IReadOnlyList<Medico>> FindByEspecialidadAsync(
        string especialidad)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
        SELECT id, nombre, registro_medico, especialidad, sede
        FROM medicos
        WHERE especialidad = @especialidad
        ORDER BY id;
        """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@especialidad", especialidad);

        await using var reader = await command.ExecuteReaderAsync();

        var medicos = new List<Medico>();

        while (await reader.ReadAsync())
        {
            medicos.Add(MapMedico(reader));
        }

        return medicos;
    }


    // Registra un médico nuevo.
    public async Task<Medico> CreateAsync(Medico medico)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            INSERT INTO medicos
                (nombre, registro_medico, especialidad, sede)
            VALUES
                (@nombre, @registroMedico, @especialidad, @sede);
            """;

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@nombre", medico.Nombre);
        command.Parameters.AddWithValue(
            "@registroMedico", medico.RegistroMedico);
        command.Parameters.AddWithValue(
            "@especialidad", medico.Especialidad);
        command.Parameters.AddWithValue(
            "@sede", medico.Sede.ToString());

        await command.ExecuteNonQueryAsync();

        var nuevoId = checked((int)command.LastInsertedId);

        return new Medico
        {
            Id = nuevoId,
            Nombre = medico.Nombre,
            RegistroMedico = medico.RegistroMedico,
            Especialidad = medico.Especialidad,
            Sede = medico.Sede
        };
    }

    // Actualiza un médico existente.
    public async Task<Medico?> UpdateAsync(int id, Medico medico)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            UPDATE medicos
            SET nombre = @nombre,
                registro_medico = @registroMedico,
                especialidad = @especialidad,
                sede = @sede
            WHERE id = @id;
            """;

        await using var command = new MySqlCommand(sql, connection);

        command.Parameters.AddWithValue("@nombre", medico.Nombre);
        command.Parameters.AddWithValue(
            "@registroMedico", medico.RegistroMedico);
        command.Parameters.AddWithValue(
            "@especialidad", medico.Especialidad);
        command.Parameters.AddWithValue(
            "@sede", medico.Sede.ToString());
        command.Parameters.AddWithValue("@id", id);

        await command.ExecuteNonQueryAsync();

        // Consultamos nuevamente para comprobar que el médico existe.
        const string selectSql = """
            SELECT id, nombre, registro_medico, especialidad, sede
            FROM medicos
            WHERE id = @id;
            """;

        await using var selectCommand = new MySqlCommand(selectSql, connection);
        selectCommand.Parameters.AddWithValue("@id", id);

        await using var reader = await selectCommand.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return MapMedico(reader);

        return null;
    }

    // Elimina un médico por su ID.
    public async Task<bool> RemoveAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = """
            DELETE FROM medicos
            WHERE id = @id;
            """;

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);

        var rowsAffected = await command.ExecuteNonQueryAsync();

        return rowsAffected > 0;
    }
}
