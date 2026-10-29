using System.ComponentModel.DataAnnotations;
using ms_pacientes.Exceptions;
using ms_pacientes.Models;
using ms_pacientes.Repositories;

namespace ms_pacientes.Services;

public sealed class PacientesService : IPacientesService
{
    private readonly IPacientesRepository _repo;
    public PacientesService(IPacientesRepository repo)
    {
        _repo = repo;
    }

    public async Task<IReadOnlyList<Paciente>> ListarAsync()
    {
        var pacientes = await _repo.FindAllAsync();
        return pacientes;
    }

    public async Task<Paciente> ObtenerPorIdAsync(int id)
    {
        var paciente = await _repo.FindByIdAsync(id) ?? throw new ApiException(404, $"No existe el paciente con id {id}");
        return paciente;
    }
    public async Task<Paciente> CrearAsync(CrearPacienteRequest request)
    {
        var documento = request.Documento.Trim();

        var existente = await _repo.FindByDocumentAsync(documento);

        if (existente is not null)
        {
            throw new ApiException(
                409,
                $"Ya existe un paciente con el documento {documento}");
        }

        // Construye la entidad con los datos permitidos por el contrato.
        var paciente = new Paciente
        {
            Nombre = request.Nombre.Trim(),
            Documento = documento,
            FechaNacimiento = request.FechaNacimiento!.Value,
            Eps = request.Eps.Trim(),
            Telefono = request.Telefono.Trim(),
        };

        return await _repo.CreateAsync(paciente);
    }
}