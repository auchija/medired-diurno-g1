using ms_pacientes.Models;

namespace ms_pacientes.Repositories;

public interface IPacientesRepository
{
    public Task<List<Paciente>> FindAllAsync();
    public Task<Paciente?> FindByIdAsync(int id);
    public Task<Paciente?> FindByDocumentAsync(string documento);
    public Task<Paciente> CreateAsync(Paciente paciente);
}