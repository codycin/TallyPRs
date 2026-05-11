namespace TallahasseePRs.Api.DTOs.Lift
{
    public sealed class LiftResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string DefaultUnit { get; set; } = "lb";
    }
}
