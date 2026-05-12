using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMunicipalityHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IntermediateRegions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StateId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntermediateRegions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IntermediateRegions_States_StateId",
                        column: x => x.StateId,
                        principalTable: "States",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Mesoregions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StateId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mesoregions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mesoregions_States_StateId",
                        column: x => x.StateId,
                        principalTable: "States",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImmediateRegions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IntermediateRegionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImmediateRegions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImmediateRegions_IntermediateRegions_IntermediateRegionId",
                        column: x => x.IntermediateRegionId,
                        principalTable: "IntermediateRegions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Microregions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    MesoregionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Microregions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Microregions_Mesoregions_MesoregionId",
                        column: x => x.MesoregionId,
                        principalTable: "Mesoregions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Municipalities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    MicroregionId = table.Column<int>(type: "integer", nullable: false),
                    ImmediateRegionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Municipalities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Municipalities_ImmediateRegions_ImmediateRegionId",
                        column: x => x.ImmediateRegionId,
                        principalTable: "ImmediateRegions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Municipalities_Microregions_MicroregionId",
                        column: x => x.MicroregionId,
                        principalTable: "Microregions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImmediateRegions_IntermediateRegionId",
                table: "ImmediateRegions",
                column: "IntermediateRegionId");

            migrationBuilder.CreateIndex(
                name: "IX_IntermediateRegions_StateId",
                table: "IntermediateRegions",
                column: "StateId");

            migrationBuilder.CreateIndex(
                name: "IX_Mesoregions_StateId",
                table: "Mesoregions",
                column: "StateId");

            migrationBuilder.CreateIndex(
                name: "IX_Microregions_MesoregionId",
                table: "Microregions",
                column: "MesoregionId");

            migrationBuilder.CreateIndex(
                name: "IX_Municipalities_ImmediateRegionId",
                table: "Municipalities",
                column: "ImmediateRegionId");

            migrationBuilder.CreateIndex(
                name: "IX_Municipalities_MicroregionId",
                table: "Municipalities",
                column: "MicroregionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Municipalities");

            migrationBuilder.DropTable(
                name: "ImmediateRegions");

            migrationBuilder.DropTable(
                name: "Microregions");

            migrationBuilder.DropTable(
                name: "IntermediateRegions");

            migrationBuilder.DropTable(
                name: "Mesoregions");
        }
    }
}
