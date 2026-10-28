using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeautySalonAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailToClient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkSchedules_AspNetUsers_ProviderId",
                table: "WorkSchedules");

            migrationBuilder.AlterColumn<string>(
                name: "ProviderId",
                table: "WorkSchedules",
                type: "varchar(255)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Clients",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkSchedules_AspNetUsers_ProviderId",
                table: "WorkSchedules",
                column: "ProviderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkSchedules_AspNetUsers_ProviderId",
                table: "WorkSchedules");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Clients");

            migrationBuilder.UpdateData(
                table: "WorkSchedules",
                keyColumn: "ProviderId",
                keyValue: null,
                column: "ProviderId",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "ProviderId",
                table: "WorkSchedules",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkSchedules_AspNetUsers_ProviderId",
                table: "WorkSchedules",
                column: "ProviderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
