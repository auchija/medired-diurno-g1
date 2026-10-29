using ms_medicos.Models;

namespace ms_medicos.Services;

public interface IMedicosService
{
    Task<IReadOnlyList<Medico>> ListarAsync();
    Task<Medico> ObtenerPorIdAsync(int id);
    Task<Medico> CrearAsync(CrearMedicoRequest request);
}