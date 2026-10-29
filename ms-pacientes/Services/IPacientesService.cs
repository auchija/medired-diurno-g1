using ms_pacientes.Models;

namespace ms_pacientes.Services;

public interface IPacientesService
{
    Task<IReadOnlyList<Paciente>> ListarAsync();

    Task<Paciente> ObtenerPorIdAsync(int id);

    Task<Paciente> CrearAsync(CrearPacienteRequest request);
}