using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TallahasseePRs.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_UserId",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_RecipientId",
                table: "Notifications");

            migrationBuilder.CreateIndex(
                name: "IX_Votes_PRPostId",
                table: "Votes",
                column: "PRPostId");

            migrationBuilder.CreateIndex(
                name: "IX_Profiles_DisplayName",
                table: "Profiles",
                column: "DisplayName");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_CreatedAt_Id",
                table: "Posts",
                columns: new[] { "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Posts_Status",
                table: "Posts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_UserId_CreatedAt_Id",
                table: "Posts",
                columns: new[] { "UserId", "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientId_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "RecipientId", "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Lifts_Category",
                table: "Lifts",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Lifts_Name",
                table: "Lifts",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Follows_FollowerId_FollowedId",
                table: "Follows",
                columns: new[] { "FollowerId", "FollowedId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Votes_PRPostId",
                table: "Votes");

            migrationBuilder.DropIndex(
                name: "IX_Profiles_DisplayName",
                table: "Profiles");

            migrationBuilder.DropIndex(
                name: "IX_Posts_CreatedAt_Id",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_Status",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_UserId_CreatedAt_Id",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_RecipientId_IsRead_CreatedAt",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Lifts_Category",
                table: "Lifts");

            migrationBuilder.DropIndex(
                name: "IX_Lifts_Name",
                table: "Lifts");

            migrationBuilder.DropIndex(
                name: "IX_Follows_FollowerId_FollowedId",
                table: "Follows");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_UserId",
                table: "Posts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientId",
                table: "Notifications",
                column: "RecipientId");
        }
    }
}
