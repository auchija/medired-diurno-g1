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

}