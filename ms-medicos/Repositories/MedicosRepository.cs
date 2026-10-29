using ms_medicos.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ms_medicos.Repositories;

public sealed class MedicosRepository : IMedicosRepository
{
    private readonly List<Medico> _medicos =
    [
        new() { Id = 1, Nombre = "Carlos Ruiz", RegistroMedico = "RM-FICTICIO-001", Especialidad = "Medicina general", Sede = Sede.Cali},
        new() { Id = 2, Nombre = "Mariana Torres", RegistroMedico = "RM-FICTICIO-002", Especialidad = "Pediatría", Sede = Sede.Bogotá },
        new() { Id = 3, Nombre = "Andrés Mendoza", RegistroMedico = "RM-FICTICIO-003", Especialidad = "Cardiología", Sede = Sede.Medellín }
    ];

    private int _siguienteId = 4;

    public Task<List<Medico>> FindAllAsync()
    {
        return Task.FromResult(_medicos.ToList());
    }

    public Task<Medico?> FindByIdAsync(int id)
    {
        return Task.FromResult(_medicos.FirstOrDefault(u => u.Id == id));
    }

    public Task<Medico?> FindByRegistroMedicoAsync(string registroMedico)
    {
        return Task.FromResult(_medicos.FirstOrDefault(u => u.RegistroMedico  == registroMedico));
    }

    public Task<Medico> CreateAsync(Medico medico)
    {
        var nuevo = new Medico
        {
            Id = _siguienteId++,
            Nombre = medico.Nombre,
            RegistroMedico = medico.RegistroMedico,
            Especialidad = medico.Especialidad,
            Sede = medico.Sede
        };

        _medicos.Add(nuevo);
        return Task.FromResult(nuevo);
    }
}