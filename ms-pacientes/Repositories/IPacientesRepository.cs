using ms_pacientes.Models;

namespace ms_pacientes.Repositories;

public interface IPacientesRepository
{
    public Task<List<Paciente>> FindAllAsync();
    public Task<Paciente?> FindByIdAsync(int id);
    Task<IReadOnlyList<Paciente>> FindByIdsAsync(IReadOnlyCollection<int> ids);
    public Task<Paciente?> FindByDocumentAsync(string documento);
    public Task<Paciente> CreateAsync(Paciente paciente);
    Task<Paciente?> UpdateAsync(int id, Paciente paciente);
    Task<bool> RemoveAsync(int id);
}