using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models;

public class TseCandidate
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int? ANO_ELEICAO { get; set; }

    public int? CD_TIPO_ELEICAO { get; set; }
    public string? NM_TIPO_ELEICAO { get; set; }
    public int? NR_TURNO { get; set; }
    public int? CD_ELEICAO { get; set; }
    public string? DS_ELEICAO { get; set; }
    public string? DT_ELEICAO { get; set; }
    public string? TP_ABRANGENCIA { get; set; }
    public string? SG_UF { get; set; }
    public string? SG_UE { get; set; }
    public string? NM_UE { get; set; }
    public int? CD_CARGO { get; set; }
    public string? DS_CARGO { get; set; }

    [Required]
    public long SQ_CANDIDATO { get; set; } // Identificador único do candidato no TSE

    public int? NR_CANDIDATO { get; set; }
    public string? NM_CANDIDATO { get; set; }
    public string? NM_URNA_CANDIDATO { get; set; }
    public string? NM_SOCIAL_CANDIDATO { get; set; }
    public string? NR_CPF_CANDIDATO { get; set; }
    public string? DS_EMAIL { get; set; }
    public int? CD_SITUACAO_CANDIDATURA { get; set; }
    public string? DS_SITUACAO_CANDIDATURA { get; set; }
    public string? TP_AGREMIACAO { get; set; }
    public int? NR_PARTIDO { get; set; }
    public string? SG_PARTIDO { get; set; }
    public string? NM_PARTIDO { get; set; }
    public int? NR_FEDERACAO { get; set; }
    public string? NM_FEDERACAO { get; set; }
    public string? SG_FEDERACAO { get; set; }
    public string? DS_COMPOSICAO_FEDERACAO { get; set; }
    public long? SQ_COLIGACAO { get; set; }
    public string? NM_COLIGACAO { get; set; }
    public string? DS_COMPOSICAO_COLIGACAO { get; set; }
    public string? SG_UF_NASCIMENTO { get; set; }
    public string? DT_NASCIMENTO { get; set; }
    public string? NR_TITULO_ELEITORAL_CANDIDATO { get; set; }
    public int? CD_GENERO { get; set; }
    public string? DS_GENERO { get; set; }
    public int? CD_GRAU_INSTRUCAO { get; set; }
    public string? DS_GRAU_INSTRUCAO { get; set; }
    public int? CD_ESTADO_CIVIL { get; set; }
    public string? DS_ESTADO_CIVIL { get; set; }
    public int? CD_COR_RACA { get; set; }
    public string? DS_COR_RACA { get; set; }
    public int? CD_OCUPACAO { get; set; }
    public string? DS_OCUPACAO { get; set; }
    public int? CD_SIT_TOT_TURNO { get; set; }
    public string? DS_SIT_TOT_TURNO { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
