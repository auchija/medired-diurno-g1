using ms_pacientes.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ms_pacientes.Repositories;

public class PacientesRepository : IPacientesRepository
{
    private readonly List<Paciente> _pacientes =
    [
        new() { Id = 1, Nombre = "Lucía Gómez", Documento = "DOC-FICTICIO-001", FechaNacimiento = new DateOnly(1990, 4, 18), Eps = "Salud Ejemplo", Telefono = "3000000001"},
        new() { Id = 2, Nombre = "Mateo Rodríguez", Documento = "DOC-FICTICIO-002", FechaNacimiento = new DateOnly(1985, 9, 23), Eps = "EPS Demostración", Telefono = "3000000002"},
        new() { Id = 3, Nombre = "Valentina Pérez", Documento = "DOC-FICTICIO-003", FechaNacimiento = new DateOnly(2001, 2, 14), Eps = "Salud Ejemplo", Telefono = "3000000003"}
    ];

    private int _siguienteId = 4;

    public Task<List<Paciente>> FindAllAsync()
    {
        return Task.FromResult(_pacientes.ToList());
    }

    public Task<IReadOnlyList<Paciente>> FindByIdsAsync(
        IReadOnlyCollection<int> ids)
    {
        IReadOnlyList<Paciente> resultado = _pacientes.Where(m => ids.Contains(m.Id)).ToList();

        return Task.FromResult(resultado);
    }


    public Task<Paciente?> FindByIdAsync(int id)
    {
        return Task.FromResult(_pacientes.FirstOrDefault(p => p.Id == id));
    }

    public Task<Paciente?> FindByDocumentAsync(string documento)
    {
        return Task.FromResult(_pacientes.FirstOrDefault(u => u.Documento == documento));
    }
    public Task<Paciente> CreateAsync(Paciente paciente)
    {
        var nuevo = new Paciente
        {
            Id = _siguienteId++,
            Nombre = paciente.Nombre,
            Documento = paciente.Documento,
            FechaNacimiento = paciente.FechaNacimiento,
            Eps = paciente.Eps,
            Telefono = paciente.Telefono
        };

        _pacientes.Add(nuevo);
        return Task.FromResult(nuevo);
    }

    public Task<Paciente?> UpdateAsync(int id, Paciente paciente)
    {
        var pacienteExistente = _pacientes.FirstOrDefault(p => p.Id == id);

        if (pacienteExistente == null)
        {
            return Task.FromResult<Paciente?>(null);
        }

        var pacienteActualizado = new Paciente
        {
            Id = pacienteExistente.Id,
            Nombre = paciente.Nombre,
            Documento = paciente.Documento,
            FechaNacimiento = paciente.FechaNacimiento,
            Eps = paciente.Eps,
            Telefono = paciente.Telefono
        };

        var index = _pacientes.IndexOf(pacienteExistente);
        _pacientes.RemoveAt(index);
        _pacientes.Insert(index, pacienteActualizado);

        return Task.FromResult((Paciente?)pacienteActualizado);
    }

    public Task<bool> RemoveAsync(int id)
    {
        var pacienteEncontrado = _pacientes.FirstOrDefault(p => p.Id == id);

        if (pacienteEncontrado == null)
        {
            return Task.FromResult(false);
        }

        _pacientes.Remove(pacienteEncontrado);
        return Task.FromResult(true);
    }
}