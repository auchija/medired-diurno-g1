using ms_medicos.Models;

namespace ms_medicos.Repositories;

public interface IMedicosRepository
{
    Task<List<Medico>> FindAllAsync();
    Task<Medico?> FindByIdAsync(int id);
    Task<Medico?> FindByRegistroMedicoAsync(string registroMedico);
    Task<Medico> CreateAsync(Medico medico);
}
