using System.ComponentModel.DataAnnotations;
using ms_medicos.Exceptions;
using ms_medicos.Models;
using ms_medicos.Repositories;

namespace ms_medicos.Services;


public sealed class MedicosService : IMedicosService
{
    private readonly IMedicosRepository _repo;

    public MedicosService(IMedicosRepository repo)
    {
        _repo = repo;
    }

    public async Task<IReadOnlyList<Medico>> ListarAsync()
    {
        var medicos = await _repo.FindAllAsync();
        return medicos;
    }

    public async Task<Medico> ObtenerPorIdAsync(int id)
    {
        var medico = await _repo.FindByIdAsync(id);
        
        if (medico is null)
        {
            throw new ApiException(404, $"No existe el médico con id {id}");
        }
        return medico;
    }

    public async Task<Medico> CrearAsync(CrearMedicoRequest request)
    {
        var registroMedico = request.RegistroMedico.Trim();

        var existente = await _repo.FindByRegistroMedicoAsync(registroMedico);

        if (existente is not null)
        {
            throw new ApiException(
                409, 
                $"Ya existe un médico con el registro médico {registroMedico}");
        }

        // Construir la entidad con los datos permitidos por el contrato
        var medico = new Medico
        {
            Nombre = request.Nombre.Trim(),
            RegistroMedico = registroMedico,
            Especialidad = request.Especialidad.Trim(),
            Sede = request.Sede ?? throw new ApiException(400, "La sede es obligatoria")
        };

        return await _repo.CreateAsync(medico);
    }
}