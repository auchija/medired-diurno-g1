
using ms_medicos.Models;

namespace ms_medicos.Repositories;

public interface IMedicosRepository
{
    Task<List<Medico>> FindAllAsync();

    Task<IReadOnlyList<Medico>> FindByIdsAsync(
        IReadOnlyCollection<int> ids);

    Task<Medico?> FindByIdAsync(int id);

    Task<Medico?> FindByRegistroMedicoAsync(string registroMedico);

    Task<Medico> CreateAsync(Medico medico);

    Task<Medico?> UpdateAsync(int id, Medico medico);

    Task<bool> RemoveAsync(int id);
}
