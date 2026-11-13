/*

using Microsoft.AspNetCore.Authorization;
*/

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ms_pacientes.Exceptions;
using ms_pacientes.Models;
using ms_pacientes.Services;

namespace ms_pacientes.Controllers;

[ApiController]
[Route("pacientes")]
[Authorize]
public class PacientesController : ControllerBase
{
    private readonly IPacientesService _service;

    public PacientesController(IPacientesService service)
    {
        _service = service;
    }

    // GET /pacientes
    // GET /pacientes?ids=1,2,3
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Paciente>>> Listar(
    [FromQuery] string? ids = null)
    {
        var pacientes = await _service.ListarAsync(ids);
        return Ok(pacientes);
    }

    // GET /pacientes/:id
    [HttpGet("{id}")]
    public async Task<ActionResult<Paciente>> ObtenerPorId(int id)
    {
        var paciente = await _service.ObtenerPorIdAsync(id);
        return Ok(paciente);
    }

    // GET /pacientes/eps?eps=...
    [HttpGet("eps")]
    public async Task<ActionResult<IReadOnlyList<Paciente>>> ObtenerPorEps(
        [FromQuery] string eps)
    {
        var pacientes = await _service.ObtenerPorEpsAsync(eps);
        return Ok(pacientes);
    }

    // POST /pacientes
    [HttpPost]
    [Authorize(Roles = "administrador, admisiones")]
    public async Task<ActionResult<Paciente>> Crear(
        [FromBody] CrearPacienteRequest request)
    {
        var nuevo = await _service.CrearAsync(request);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = nuevo.Id },
            nuevo);
    }

    // PUT /pacientes/{id}
    [HttpPut("{id:int}")]
    [Authorize(Roles = "administrador, admisiones")]
    public async Task<ActionResult<Paciente>> Actualizar(int id, [FromBody] ActualizarPacienteRequest request)
    {
        var actualizado = await _service.ActualizarAsync(id, request);

        return Ok(actualizado);
    }

    // DELETE /pacientes/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "administrador, admisiones")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);

        return NoContent();
    }
}