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

    public async Task<IReadOnlyList<Paciente>> ListarAsync(string? ids = null)
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
                throw new ApiException(400, "Todos los IDs deben ser números enteros.");
            }

            ValidarId(id);
            idsNumericos.Add(id);
        }

        return await _repo.FindByIdsAsync(idsNumericos.Distinct().ToList());
    }

    public async Task<Paciente> ObtenerPorIdAsync(int id)
    {
        ValidarId(id);

        var paciente = await _repo.FindByIdAsync(id)
            ?? throw new ApiException(404, $"No existe el paciente con id {id}");

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

        ValidarFechaNacimiento(request.FechaNacimiento!.Value);

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

    private static void ValidarFechaNacimiento(DateOnly fecha)
    {
        if (fecha > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new ApiException(400, "La fecha de nacimiento no puede ser futura.");
        }
    }

    public async Task<Paciente> ActualizarAsync(int id, ActualizarPacienteRequest request)
    {
        ValidarId(id);

        var pacienteExistente = await _repo.FindByIdAsync(id);

        if (pacienteExistente is null)
        {
            throw new ApiException(404, $"No existe el paciente con id {id}");
        }

        var nuevoDocumento = !string.IsNullOrWhiteSpace(request.Documento)
            ? request.Documento.Trim()
            : pacienteExistente.Documento;

        if (!string.IsNullOrEmpty(request.Documento))
        {
            var documentoNormalizado = nuevoDocumento.Trim();
            var otroConMismoDocumento = await _repo.FindByDocumentAsync(documentoNormalizado);

            if (otroConMismoDocumento is not null && otroConMismoDocumento.Id != id)
            {
                throw new ApiException(
                    409,
                    $"Ya existe un paciente con el documento {nuevoDocumento}");
            }
        }

        var nombre = !string.IsNullOrEmpty(request.Nombre)
            ? request.Nombre.Trim()
            : pacienteExistente.Nombre;

        var eps = !string.IsNullOrEmpty(request.Eps)
            ? request.Eps.Trim()
            : pacienteExistente.Eps;

        DateOnly? fechaNacimiento = null;
        if (request.FechaNacimiento is not null)
        {
            ValidarFechaNacimiento(request.FechaNacimiento.Value);
            fechaNacimiento = request.FechaNacimiento.Value;
        }

        var telefono = !string.IsNullOrEmpty(request.Telefono)
            ? request.Telefono.Trim()
            : pacienteExistente.Telefono;

        var paciente = new Paciente
        {
            Id = pacienteExistente.Id,
            Nombre = nombre,
            Documento = nuevoDocumento,
            FechaNacimiento = fechaNacimiento ?? pacienteExistente.FechaNacimiento,
            Eps = eps,
            Telefono = telefono,
        };

        return await _repo.UpdateAsync(id, paciente)
            ?? throw new ApiException(500, $"Error interno: No se pudo actualizar el paciente con id {id}");
    }

    public async Task<bool> EliminarAsync(int id)
    {
        ValidarId(id);

        var eliminado = await _repo.RemoveAsync(id);

        if (!eliminado)
        {
            throw new ApiException(404, $"No existe el paciente con id {id}");
        }

        return eliminado;
    }

    private static void ValidarId(int id)
    {
        if (id <= 0)
        {
            throw new ApiException(
                400,
                $"El id '{id}' debe ser un entero positivo");
        }
    }
}
