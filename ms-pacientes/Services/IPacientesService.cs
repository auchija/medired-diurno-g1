using ms_pacientes.Models;

namespace ms_pacientes.Services;

public interface IPacientesService
{
    Task<IReadOnlyList<Paciente>> ListarAsync(string? ids = null);

    Task<Paciente> ObtenerPorIdAsync(int id);

    Task<IReadOnlyList<Paciente>> ObtenerPorEpsAsync(string eps);

    Task<Paciente> CrearAsync(CrearPacienteRequest request);

    Task<Paciente> ActualizarAsync(int id, ActualizarPacienteRequest request);

    Task<bool> EliminarAsync(int id);
}