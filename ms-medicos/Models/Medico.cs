// =====================================================================
// CAPA DE MODELO (entidad) para médicos
// Define qué campos tiene un Medico y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// Versión del Taller 1: sin autenticación o validación compleja. La
// validación se maneja mediante attributes de Data Annotation.
// =====================================================================

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ms_medicos.Models;

// Definición de las sedes permitidas
public enum Sede { Cali, Bogotá, Medellín }

public class Medico
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El registro médico es obligatorio")]
    [StringLength(100, ErrorMessage = "El registro médico debe tener máximo 100 caracteres")]
    public string RegistroMedico { get; set; } = string.Empty;

    [Required(ErrorMessage = "La especialidad es obligatoria")]
    [StringLength(100, ErrorMessage = "La especialidad no puede exceder los 100 caracteres")]
    public string Especialidad { get; set; } = string.Empty;

    [Required(ErrorMessage = "La sede es obligatoria")]
    public Sede Sede { get; set; }
}

public sealed class CrearMedicoRequest
{
    [JsonPropertyName("nombre")]
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(100, MinimumLength = 2,
        ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres")]
    public string Nombre { get; init; } = string.Empty;

    [JsonPropertyName("registro_medico")]
    [Required(ErrorMessage = "El registro médico es obligatorio")]
    [StringLength(100,
        ErrorMessage = "El registro médico debe tener máximo 100 caracteres")]
    public string RegistroMedico { get; init; } = string.Empty;

    [JsonPropertyName("especialidad")]
    [Required(ErrorMessage = "La especialidad es obligatoria")]
    [StringLength(100,
        ErrorMessage = "La especialidad no puede exceder los 100 caracteres")]
    public string Especialidad { get; init; } = string.Empty;

    [JsonPropertyName("sede")]
    [Required(ErrorMessage = "La sede es obligatoria")]
    public Sede? Sede { get; init; }
}