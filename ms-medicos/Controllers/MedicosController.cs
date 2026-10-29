/*

*/

using Microsoft.AspNetCore.Mvc;
using ms_medicos.Exceptions;
using ms_medicos.Models;
using ms_medicos.Services;

namespace ms_medicos.Controllers;

[ApiController]
[Route("medicos")]
public class MedicosController : ControllerBase
{
    private readonly IMedicosService _service;

    public MedicosController(IMedicosService service)
    {
        _service = service;
    }

    // GET /medicos
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Medico>>> Listar()
    {
        var medicos = await _service.ListarAsync();
        return Ok(medicos);
    }

    // GET /medicos/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Medico>> ObtenerPorId(int id)
    {
        var medico = await _service.ObtenerPorIdAsync(id);
        return Ok(medico);
    }

    // POST /medicos
    [HttpPost]
    public async Task<ActionResult<Medico>> Crear(
        [FromBody] CrearMedicoRequest request)
    {
        var nuevo = await _service.CrearAsync(request);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = nuevo.Id },
            nuevo);
    }
}