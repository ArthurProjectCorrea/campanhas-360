using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTseCandidateTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TseCandidates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CD_TIPO_ELEICAO = table.Column<int>(type: "integer", nullable: true),
                    NM_TIPO_ELEICAO = table.Column<string>(type: "text", nullable: true),
                    NR_TURNO = table.Column<int>(type: "integer", nullable: true),
                    CD_ELEICAO = table.Column<int>(type: "integer", nullable: true),
                    DS_ELEICAO = table.Column<string>(type: "text", nullable: true),
                    DT_ELEICAO = table.Column<string>(type: "text", nullable: true),
                    TP_ABRANGENCIA = table.Column<string>(type: "text", nullable: true),
                    SG_UF = table.Column<string>(type: "text", nullable: true),
                    SG_UE = table.Column<string>(type: "text", nullable: true),
                    NM_UE = table.Column<string>(type: "text", nullable: true),
                    CD_CARGO = table.Column<int>(type: "integer", nullable: true),
                    DS_CARGO = table.Column<string>(type: "text", nullable: true),
                    SQ_CANDIDATO = table.Column<long>(type: "bigint", nullable: false),
                    NR_CANDIDATO = table.Column<int>(type: "integer", nullable: true),
                    NM_CANDIDATO = table.Column<string>(type: "text", nullable: true),
                    NM_URNA_CANDIDATO = table.Column<string>(type: "text", nullable: true),
                    NM_SOCIAL_CANDIDATO = table.Column<string>(type: "text", nullable: true),
                    NR_CPF_CANDIDATO = table.Column<string>(type: "text", nullable: true),
                    DS_EMAIL = table.Column<string>(type: "text", nullable: true),
                    CD_SITUACAO_CANDIDATURA = table.Column<int>(type: "integer", nullable: true),
                    DS_SITUACAO_CANDIDATURA = table.Column<string>(type: "text", nullable: true),
                    TP_AGREMIACAO = table.Column<string>(type: "text", nullable: true),
                    NR_PARTIDO = table.Column<int>(type: "integer", nullable: true),
                    SG_PARTIDO = table.Column<string>(type: "text", nullable: true),
                    NM_PARTIDO = table.Column<string>(type: "text", nullable: true),
                    NR_FEDERACAO = table.Column<int>(type: "integer", nullable: true),
                    NM_FEDERACAO = table.Column<string>(type: "text", nullable: true),
                    SG_FEDERACAO = table.Column<string>(type: "text", nullable: true),
                    DS_COMPOSICAO_FEDERACAO = table.Column<string>(type: "text", nullable: true),
                    SQ_COLIGACAO = table.Column<long>(type: "bigint", nullable: true),
                    NM_COLIGACAO = table.Column<string>(type: "text", nullable: true),
                    DS_COMPOSICAO_COLIGACAO = table.Column<string>(type: "text", nullable: true),
                    SG_UF_NASCIMENTO = table.Column<string>(type: "text", nullable: true),
                    DT_NASCIMENTO = table.Column<string>(type: "text", nullable: true),
                    NR_TITULO_ELEITORAL_CANDIDATO = table.Column<string>(type: "text", nullable: true),
                    CD_GENERO = table.Column<int>(type: "integer", nullable: true),
                    DS_GENERO = table.Column<string>(type: "text", nullable: true),
                    CD_GRAU_INSTRUCAO = table.Column<int>(type: "integer", nullable: true),
                    DS_GRAU_INSTRUCAO = table.Column<string>(type: "text", nullable: true),
                    CD_ESTADO_CIVIL = table.Column<int>(type: "integer", nullable: true),
                    DS_ESTADO_CIVIL = table.Column<string>(type: "text", nullable: true),
                    CD_COR_RACA = table.Column<int>(type: "integer", nullable: true),
                    DS_COR_RACA = table.Column<string>(type: "text", nullable: true),
                    CD_OCUPACAO = table.Column<int>(type: "integer", nullable: true),
                    DS_OCUPACAO = table.Column<string>(type: "text", nullable: true),
                    CD_SIT_TOT_TURNO = table.Column<int>(type: "integer", nullable: true),
                    DS_SIT_TOT_TURNO = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TseCandidates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TseCandidates_SQ_CANDIDATO",
                table: "TseCandidates",
                column: "SQ_CANDIDATO",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TseCandidates");
        }
    }
}
