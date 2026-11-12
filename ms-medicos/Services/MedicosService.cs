
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

    public async Task<IReadOnlyList<Medico>> ListarAsync(string? ids = null)
    {
        if (string.IsNullOrWhiteSpace(ids))
        {
            return await _repo.FindAllAsync();
        }

        var partes = ids.Split(',', StringSplitOptions.TrimEntries);
        var idsNumericos = new List<int>();

        foreach (var parte in partes)
        {
            if (!int.TryParse(parte, out var id))
            {
                throw new ApiException(
                    400,
                    "Todos los IDs deben ser números enteros."
                );
            }

            ValidarId(id);
            idsNumericos.Add(id);
        }

        return await _repo.FindByIdsAsync(idsNumericos.Distinct().ToList());
    }

    public async Task<Medico> ObtenerPorIdAsync(int id)
    {
        ValidarId(id);

        var medico = await _repo.FindByIdAsync(id)
            ?? throw new ApiException(
                404,
                $"No existe el médico con id {id}"
            );

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
                $"Ya existe un médico con el registro médico {registroMedico}"
            );
        }

        var sede = request.Sede
            ?? throw new ApiException(400, "La sede es obligatoria");

        ValidarSede(sede);

        var medico = new Medico
        {
            Nombre = request.Nombre.Trim(),
            RegistroMedico = registroMedico,
            Especialidad = request.Especialidad.Trim(),
            Sede = sede
        };

        return await _repo.CreateAsync(medico);
    }

    public async Task<Medico> ActualizarAsync(
        int id,
        ActualizarMedicoRequest request)
    {
        ValidarId(id);

        var medicoExistente = await _repo.FindByIdAsync(id)
            ?? throw new ApiException(
                404,
                $"No existe el médico con id {id}"
            );

        var nuevoRegistro = !string.IsNullOrWhiteSpace(request.RegistroMedico)
            ? request.RegistroMedico.Trim()
            : medicoExistente.RegistroMedico;

        if (!string.IsNullOrWhiteSpace(request.RegistroMedico))
        {
            var otroConMismoRegistro =
                await _repo.FindByRegistroMedicoAsync(nuevoRegistro);

            if (otroConMismoRegistro is not null &&
                otroConMismoRegistro.Id != id)
            {
                throw new ApiException(
                    409,
                    $"Ya existe un médico con el registro médico {nuevoRegistro}"
                );
            }
        }

        var nombre = !string.IsNullOrWhiteSpace(request.Nombre)
            ? request.Nombre.Trim()
            : medicoExistente.Nombre;

        var especialidad = !string.IsNullOrWhiteSpace(request.Especialidad)
            ? request.Especialidad.Trim()
            : medicoExistente.Especialidad;

        var sede = medicoExistente.Sede;

        if (request.Sede.HasValue)
        {
            ValidarSede(request.Sede.Value);
            sede = request.Sede.Value;
        }

        var medico = new Medico
        {
            Id = medicoExistente.Id,
            Nombre = nombre,
            RegistroMedico = nuevoRegistro,
            Especialidad = especialidad,
            Sede = sede
        };

        return await _repo.UpdateAsync(id, medico)
            ?? throw new ApiException(
                500,
                $"Error interno: No se pudo actualizar el médico con id {id}"
            );
    }

    public async Task<bool> EliminarAsync(int id)
    {
        ValidarId(id);

        var eliminado = await _repo.RemoveAsync(id);

        if (!eliminado)
        {
            throw new ApiException(
                404,
                $"No existe el médico con id {id}"
            );
        }

        return eliminado;
    }

    private static void ValidarId(int id)
    {
        if (id <= 0)
        {
            throw new ApiException(
                400,
                $"El id '{id}' debe ser un entero positivo"
            );
        }
    }

    private static readonly HashSet<Sede> SedesValidas =
    [
        Sede.Cali,
        Sede.Bogotá,
        Sede.Medellín
    ];

    private static void ValidarSede(Sede sede)
    {
        if (!SedesValidas.Contains(sede))
        {
            throw new ApiException(
                400,
                "La sede debe ser una de las siguientes: Cali, Bogotá o Medellín."
            );
        }
    }
}
