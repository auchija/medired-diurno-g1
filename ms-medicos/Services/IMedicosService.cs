using ms_medicos.Models;

namespace ms_medicos.Services;

public interface IMedicosService
{
    Task<IReadOnlyList<Medico>> ListarAsync(string? ids = null);
    Task<Medico> ObtenerPorIdAsync(int id);
    Task<IReadOnlyList<Medico>> ObtenerPorEspecialidadAsync(string especialidad);
    Task<Medico> CrearAsync(CrearMedicoRequest request);
    Task<Medico> ActualizarAsync(int id, ActualizarMedicoRequest request);

    Task<bool> EliminarAsync(int id);
}