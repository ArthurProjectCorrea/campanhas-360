using Api.Data;
using Api.Models;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Globalization;
using System.Text;

namespace Api.Controllers;

[ApiController]
[Route("import")]
public class ImportController : BaseApiController
{
    public ImportController(ApplicationDbContext context, IConnectionMultiplexer redis) : base(context, redis)
    {
    }

    /// <summary>
    /// Importa candidatos do TSE a partir de um arquivo CSV.
    /// </summary>
    /// <param name="file">Arquivo CSV com colunas do TSE.</param>
    /// <response code="200">Importação concluída com estatísticas.</response>
    /// <response code="400">Arquivo inválido ou erro no processamento.</response>
    [AllowAnonymous]
    [HttpPost("candidates")]
    public async Task<IActionResult> ImportCandidates(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não fornecido ou vazio." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Apenas arquivos CSV são permitidos." });

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ";", // TSE utiliza ponto e vírgula por padrão
            HasHeaderRecord = true,
            HeaderValidated = null,
            MissingFieldFound = null,
        };

        int totalRecords = 0;
        int newRecordsCount = 0;
        int duplicateRecordsCount = 0;
        var ignoredColumns = new List<string>();

        try
        {
            // Carregar pares (SQ_CANDIDATO, ANO_ELEICAO) existentes para evitar AnyAsync em loop
            var existingCandidates = await Context.TseCandidates
                .Select(t => new { t.SQ_CANDIDATO, t.ANO_ELEICAO })
                .ToListAsync();

            var existingSet = existingCandidates
                .Select(t => (t.SQ_CANDIDATO, t.ANO_ELEICAO ?? 0))
                .ToHashSet();

            using (var reader = new StreamReader(file.OpenReadStream(), Encoding.GetEncoding("iso-8859-1"))) // TSE usa Latin1/ISO-8859-1
            using (var csv = new CsvReader(reader, config))
            {
                csv.Read();
                csv.ReadHeader();

                var headers = csv.HeaderRecord;
                var mappedProperties = typeof(TseCandidate).GetProperties().Select(p => p.Name).ToHashSet();

                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        if (!mappedProperties.Contains(header))
                        {
                            ignoredColumns.Add(header);
                        }
                    }
                }

                var records = csv.GetRecords<dynamic>();
                var candidatesToInsert = new List<TseCandidate>();

                // Dicionários para coletar dados das tabelas auxiliares
                var schoolings = new Dictionary<int, string>();
                var genders = new Dictionary<int, string>();
                var maritalStatuses = new Dictionary<int, string>();
                var colorRaces = new Dictionary<int, string>();
                var occupations = new Dictionary<int, string>();
                var parties = new Dictionary<int, (string acronym, string name)>();
                var positions = new Dictionary<int, (string name, string type)>();

                foreach (var record in records)
                {
                    totalRecords++;
                    var dict = (IDictionary<string, object>)record;

                    // Coleta de dados auxiliares
                    CollectAuxiliary(dict, "CD_GRAU_INSTRUCAO", "DS_GRAU_INSTRUCAO", schoolings);
                    CollectAuxiliary(dict, "CD_GENERO", "DS_GENERO", genders);
                    CollectAuxiliary(dict, "CD_ESTADO_CIVIL", "DS_ESTADO_CIVIL", maritalStatuses);
                    CollectAuxiliary(dict, "CD_COR_RACA", "DS_COR_RACA", colorRaces);
                    CollectAuxiliary(dict, "CD_OCUPACAO", "DS_OCUPACAO", occupations);

                    // Coleta de Partidos
                    if (dict.TryGetValue("NR_PARTIDO", out var pIdVal) && pIdVal != null && int.TryParse(pIdVal.ToString(), out int pId))
                    {
                        if (!parties.ContainsKey(pId))
                        {
                            var acronym = TryGetString(dict, "SG_PARTIDO") ?? "N/A";
                            var pName = TryGetString(dict, "NM_PARTIDO") ?? "NÃO INFORMADO";
                            parties.Add(pId, (acronym, pName));
                        }
                    }

                    // Coleta de Cargos (Positions)
                    if (dict.TryGetValue("CD_CARGO", out var cIdVal) && cIdVal != null && int.TryParse(cIdVal.ToString(), out int cId))
                    {
                        if (!positions.ContainsKey(cId))
                        {
                            var cName = TryGetString(dict, "DS_CARGO") ?? "NÃO INFORMADO";
                            var type = TryGetString(dict, "TP_ABRANGENCIA") ?? "N/A";
                            positions.Add(cId, (cName, type));
                        }
                    }

                    if (!dict.TryGetValue("SQ_CANDIDATO", out var sqValue) || sqValue == null) continue;
                    if (!long.TryParse(sqValue.ToString(), out long sqCandidato)) continue;

                    int anoEleicao = TryGetInt(dict, "ANO_ELEICAO") ?? 0;

                    if (existingSet.Contains((sqCandidato, anoEleicao)))
                    {
                        duplicateRecordsCount++;
                        continue;
                    }

                    var candidate = new TseCandidate
                    {
                        ANO_ELEICAO = anoEleicao == 0 ? null : anoEleicao,
                        SQ_CANDIDATO = sqCandidato,
                        CD_TIPO_ELEICAO = TryGetInt(dict, "CD_TIPO_ELEICAO"),
                        NM_TIPO_ELEICAO = TryGetString(dict, "NM_TIPO_ELEICAO"),
                        NR_TURNO = TryGetInt(dict, "NR_TURNO"),
                        CD_ELEICAO = TryGetInt(dict, "CD_ELEICAO"),
                        DS_ELEICAO = TryGetString(dict, "DS_ELEICAO"),
                        DT_ELEICAO = TryGetString(dict, "DT_ELEICAO"),
                        TP_ABRANGENCIA = TryGetString(dict, "TP_ABRANGENCIA"),
                        SG_UF = TryGetString(dict, "SG_UF"),
                        SG_UE = TryGetString(dict, "SG_UE"),
                        NM_UE = TryGetString(dict, "NM_UE"),
                        CD_CARGO = TryGetInt(dict, "CD_CARGO"),
                        DS_CARGO = TryGetString(dict, "DS_CARGO"),
                        NR_CANDIDATO = TryGetInt(dict, "NR_CANDIDATO"),
                        NM_CANDIDATO = TryGetString(dict, "NM_CANDIDATO"),
                        NM_URNA_CANDIDATO = TryGetString(dict, "NM_URNA_CANDIDATO"),
                        NM_SOCIAL_CANDIDATO = TryGetString(dict, "NM_SOCIAL_CANDIDATO"),
                        NR_CPF_CANDIDATO = TryGetString(dict, "NR_CPF_CANDIDATO"),
                        DS_EMAIL = TryGetString(dict, "DS_EMAIL"),
                        CD_SITUACAO_CANDIDATURA = TryGetInt(dict, "CD_SITUACAO_CANDIDATURA"),
                        DS_SITUACAO_CANDIDATURA = TryGetString(dict, "DS_SITUACAO_CANDIDATURA"),
                        TP_AGREMIACAO = TryGetString(dict, "TP_AGREMIACAO"),
                        NR_PARTIDO = TryGetInt(dict, "NR_PARTIDO"),
                        SG_PARTIDO = TryGetString(dict, "SG_PARTIDO"),
                        NM_PARTIDO = TryGetString(dict, "NM_PARTIDO"),
                        NR_FEDERACAO = TryGetInt(dict, "NR_FEDERACAO"),
                        NM_FEDERACAO = TryGetString(dict, "NM_FEDERACAO"),
                        SG_FEDERACAO = TryGetString(dict, "SG_FEDERACAO"),
                        DS_COMPOSICAO_FEDERACAO = TryGetString(dict, "DS_COMPOSICAO_FEDERACAO"),
                        SQ_COLIGACAO = TryGetLong(dict, "SQ_COLIGACAO"),
                        NM_COLIGACAO = TryGetString(dict, "NM_COLIGACAO"),
                        DS_COMPOSICAO_COLIGACAO = TryGetString(dict, "DS_COMPOSICAO_COLIGACAO"),
                        SG_UF_NASCIMENTO = TryGetString(dict, "SG_UF_NASCIMENTO"),
                        DT_NASCIMENTO = TryGetString(dict, "DT_NASCIMENTO"),
                        NR_TITULO_ELEITORAL_CANDIDATO = TryGetString(dict, "NR_TITULO_ELEITORAL_CANDIDATO"),
                        CD_GENERO = TryGetInt(dict, "CD_GENERO"),
                        DS_GENERO = TryGetString(dict, "DS_GENERO"),
                        CD_GRAU_INSTRUCAO = TryGetInt(dict, "CD_GRAU_INSTRUCAO"),
                        DS_GRAU_INSTRUCAO = TryGetString(dict, "DS_GRAU_INSTRUCAO"),
                        CD_ESTADO_CIVIL = TryGetInt(dict, "CD_ESTADO_CIVIL"),
                        DS_ESTADO_CIVIL = TryGetString(dict, "DS_ESTADO_CIVIL"),
                        CD_COR_RACA = TryGetInt(dict, "CD_COR_RACA"),
                        DS_COR_RACA = TryGetString(dict, "DS_COR_RACA"),
                        CD_OCUPACAO = TryGetInt(dict, "CD_OCUPACAO"),
                        DS_OCUPACAO = TryGetString(dict, "DS_OCUPACAO"),
                        CD_SIT_TOT_TURNO = TryGetInt(dict, "CD_SIT_TOT_TURNO"),
                        DS_SIT_TOT_TURNO = TryGetString(dict, "DS_SIT_TOT_TURNO"),
                        CreatedAt = DateTime.UtcNow
                    };

                    candidatesToInsert.Add(candidate);
                    existingSet.Add((sqCandidato, anoEleicao));
                    newRecordsCount++;

                    if (candidatesToInsert.Count >= 1000)
                    {
                        Context.TseCandidates.AddRange(candidatesToInsert);
                        await Context.SaveChangesAsync();
                        candidatesToInsert.Clear();
                    }
                }

                if (candidatesToInsert.Any())
                {
                    Context.TseCandidates.AddRange(candidatesToInsert);
                    await Context.SaveChangesAsync();
                }

                // Popular tabelas auxiliares
                await ProcessAuxiliaryTable(schoolings, Context.Schoolings, (id, name) => new Schooling { Id = id, Name = name });
                await ProcessAuxiliaryTable(genders, Context.Genders, (id, name) => new Gender { Id = id, Name = name });
                await ProcessAuxiliaryTable(maritalStatuses, Context.MaritalStatuses, (id, name) => new MaritalStatus { Id = id, Name = name });
                await ProcessAuxiliaryTable(colorRaces, Context.ColorRaces, (id, name) => new ColorRace { Id = id, Name = name });
                await ProcessAuxiliaryTable(occupations, Context.Occupations, (id, name) => new Occupation { Id = id, Name = name });

                // Processar Partidos
                var existingPartyIds = await Context.Parties.Select(p => p.Id).ToHashSetAsync();
                foreach (var item in parties)
                {
                    if (!existingPartyIds.Contains(item.Key))
                    {
                        Context.Parties.Add(new Party { Id = item.Key, Acronym = item.Value.acronym, Name = item.Value.name });
                    }
                }

                // Processar Cargos
                var existingPositionIds = await Context.Positions.Select(p => p.Id).ToHashSetAsync();
                foreach (var item in positions)
                {
                    if (!existingPositionIds.Contains(item.Key))
                    {
                        Context.Positions.Add(new Position { Id = item.Key, Name = item.Value.name, Type = item.Value.type });
                    }
                }

                await Context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Erro ao processar arquivo.", details = ex.Message });
        }

        return Ok(new
        {
            message = "Processamento concluído.",
            stats = new
            {
                total = totalRecords,
                imported = newRecordsCount,
                duplicates = duplicateRecordsCount,
                ignoredColumns = ignoredColumns
            }
        });
    }

    private void CollectAuxiliary(IDictionary<string, object> dict, string idKey, string nameKey, Dictionary<int, string> collection)
    {
        if (dict.TryGetValue(idKey, out var idVal) && idVal != null && int.TryParse(idVal.ToString(), out int id))
        {
            if (!collection.ContainsKey(id))
            {
                var name = dict.TryGetValue(nameKey, out var nameVal) ? nameVal?.ToString() : "NÃO INFORMADO";
                collection.Add(id, name ?? "NÃO INFORMADO");
            }
        }
    }

    private async Task ProcessAuxiliaryTable<T>(Dictionary<int, string> collected, DbSet<T> dbSet, Func<int, string, T> factory) where T : class
    {
        var existingIds = await dbSet.Select(e => EF.Property<int>(e, "Id")).ToHashSetAsync();

        foreach (var item in collected)
        {
            if (!existingIds.Contains(item.Key))
            {
                dbSet.Add(factory(item.Key, item.Value));
            }
        }
    }

    private string? TryGetString(IDictionary<string, object> dict, string key)
    {
        return dict.TryGetValue(key, out var val) ? val?.ToString() : null;
    }

    private int? TryGetInt(IDictionary<string, object> dict, string key)
    {
        if (dict.TryGetValue(key, out var val) && val != null && int.TryParse(val.ToString(), out int result))
            return result;
        return null;
    }

    private long? TryGetLong(IDictionary<string, object> dict, string key)
    {
        if (dict.TryGetValue(key, out var val) && val != null && long.TryParse(val.ToString(), out long result))
            return result;
        return null;
    }
}
