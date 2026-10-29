/*

*/

using Microsoft.AspNetCore.Mvc;
using ms_pacientes.Exceptions;
using ms_pacientes.Models;
using ms_pacientes.Services;

namespace ms_pacientes.Controllers;

[ApiController]
[Route("pacientes")]
public class PacientesController : ControllerBase
{
    private readonly IPacientesService _service;

    public PacientesController(IPacientesService service)
    {
        _service = service;
    }

    // GET /pacientes
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Paciente>>> Listar()
    {
        var pacientes = await _service.ListarAsync();
        return Ok(pacientes);
    }

    // GET /pacientes/:id
    [HttpGet("{id}")]
    public async Task<ActionResult<Paciente>> ObtenerPorId(int id)
    {
        var paciente = await _service.ObtenerPorIdAsync(id);
        return Ok(paciente);
    }

    // POST /usuarios
    [HttpPost]
    public async Task<ActionResult<Paciente>> Crear(
        [FromBody] CrearPacienteRequest request)
    {
        var nuevo = await _service.CrearAsync(request);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = nuevo.Id },
            nuevo);
    }

    // Taller 2:
    // [HttpPut("{id:int}")] para PUT /usuarios/{id}
    // [HttpDelete("{id:int}")] para DELETE /usuarios/{id}
}