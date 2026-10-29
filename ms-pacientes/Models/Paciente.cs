// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Paciente y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// Versión del Taller 1: sin autenticación o validación compleja. La
// validación se maneja mediante attributes de Data Annotation.
// =====================================================================

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ms_pacientes.Models;

public class Paciente
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El documento es obligatorio")]
    public string Documento { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria")]
    [DataType(DataType.Date)]
    public DateOnly FechaNacimiento { get; set; } = DateOnly.MinValue;

    [Required(ErrorMessage = "La EPS es obligatoria")]
    public string Eps { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio")]
    public string Telefono { get; set; } = string.Empty;
}

public sealed class CrearPacienteRequest
{
    [JsonPropertyName("nombre")]
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
    public string Nombre { get; init; } = string.Empty;

    [JsonPropertyName("documento")]
    [Required(ErrorMessage = "El documento es obligatorio")]
    [StringLength(18, MinimumLength = 9,
        ErrorMessage = "El documento debe tener entre 9 y 18 caracteres")]
    public string Documento { get; init; } = string.Empty;

    [JsonPropertyName("fecha_nacimiento")]
    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria")]
    public DateOnly? FechaNacimiento { get; init; }

    [JsonPropertyName("eps")]
    [Required(ErrorMessage = "La EPS es obligatoria")]
    [StringLength(100,
        ErrorMessage = "El nombre de la EPS no puede exceder los 100 caracteres")]
    public string Eps { get; init; } = string.Empty;

    [JsonPropertyName("telefono")]
    [Required(ErrorMessage = "El teléfono es obligatorio")]
    [Phone(ErrorMessage = "El formato del teléfono no es válido (ej: +573001234567)")]
    [StringLength(15, MinimumLength = 9,
        ErrorMessage = "El teléfono debe tener entre 9 y 15 caracteres")]
    public string Telefono { get; init; } = string.Empty;
}
