using TallahasseePRs.Api.Data;
using TallahasseePRs.Api.Models;

namespace TallahasseePRs.Api.Seeders;

public static class LiftSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {

        var lifts = new List<Lift>
        {
            // =========================
            // Powerlifting - Competition
            // =========================
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "Paused Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "Touch and Go Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "Close Grip Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Name = "Wide Grip Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Name = "Spoto Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Name = "Pin Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), Name = "Board Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Name = "Floor Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), Name = "Incline Barbell Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000011"), Name = "Decline Barbell Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },

            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000012"), Name = "Back Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000013"), Name = "High Bar Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000014"), Name = "Low Bar Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000015"), Name = "Paused Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000016"), Name = "Tempo Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000017"), Name = "Box Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000018"), Name = "Pin Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000019"), Name = "Front Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000020"), Name = "Safety Bar Squat", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000021"), Name = "Zercher Squat", Category = "Powerlifting", DefaultUnit = "lb" },

            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000022"), Name = "Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000023"), Name = "Conventional Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000024"), Name = "Sumo Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000025"), Name = "Paused Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000026"), Name = "Deficit Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000027"), Name = "Block Pull", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000028"), Name = "Rack Pull", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000029"), Name = "Romanian Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000030"), Name = "Stiff Leg Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("10000000-0000-0000-0000-000000000031"), Name = "Trap Bar Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },

            // =========================
            // Olympic Weightlifting
            // =========================
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000001"), Name = "Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000002"), Name = "Power Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000003"), Name = "Hang Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000004"), Name = "Hang Power Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000005"), Name = "Block Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000006"), Name = "Clean and Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000007"), Name = "Clean", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000008"), Name = "Power Clean", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000009"), Name = "Hang Clean", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000010"), Name = "Hang Power Clean", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000011"), Name = "Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000012"), Name = "Split Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000013"), Name = "Power Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("20000000-0000-0000-0000-000000000014"), Name = "Push Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },

            // =========================
            // Barbell Upper Body
            // =========================
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000001"), Name = "Overhead Press", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000002"), Name = "Standing Barbell Shoulder Press", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000003"), Name = "Seated Barbell Shoulder Press", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000004"), Name = "Push Press", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000005"), Name = "Behind the Neck Press", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000006"), Name = "Barbell Row", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000007"), Name = "Pendlay Row", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000008"), Name = "Yates Row", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000009"), Name = "Barbell Curl", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000010"), Name = "EZ Bar Curl", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000011"), Name = "Skull Crusher", Category = "Barbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("30000000-0000-0000-0000-000000000012"), Name = "Close Grip Barbell Floor Press", Category = "Barbell", DefaultUnit = "lb" },

            // =========================
            // Dumbbell
            // =========================
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000001"), Name = "Dumbbell Bench Press", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000002"), Name = "Incline Dumbbell Bench Press", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000003"), Name = "Decline Dumbbell Bench Press", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000004"), Name = "Dumbbell Shoulder Press", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000005"), Name = "Seated Dumbbell Shoulder Press", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000006"), Name = "Dumbbell Row", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000007"), Name = "Chest Supported Dumbbell Row", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000008"), Name = "Dumbbell Curl", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000009"), Name = "Hammer Curl", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000010"), Name = "Dumbbell Lateral Raise", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000011"), Name = "Dumbbell Rear Delt Fly", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000012"), Name = "Dumbbell Fly", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000013"), Name = "Dumbbell Pullover", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000014"), Name = "Goblet Squat", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000015"), Name = "Dumbbell Romanian Deadlift", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000016"), Name = "Dumbbell Lunges", Category = "Dumbbell", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("40000000-0000-0000-0000-000000000017"), Name = "Dumbbell Bulgarian Split Squat", Category = "Dumbbell", DefaultUnit = "lb" },

            // =========================
            // Machines - Chest/Shoulders
            // =========================
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000001"), Name = "Machine Chest Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000002"), Name = "Incline Machine Chest Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000003"), Name = "Decline Machine Chest Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000004"), Name = "Plate Loaded Chest Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000005"), Name = "Plate Loaded Incline Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000006"), Name = "Pec Deck", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000007"), Name = "Machine Fly", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000008"), Name = "Machine Shoulder Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000009"), Name = "Plate Loaded Shoulder Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000010"), Name = "Machine Lateral Raise", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("50000000-0000-0000-0000-000000000011"), Name = "Rear Delt Machine", Category = "Machine", DefaultUnit = "lb" },

            // =========================
            // Machines - Back
            // =========================
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000001"), Name = "Lat Pulldown", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000002"), Name = "Close Grip Lat Pulldown", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000003"), Name = "Wide Grip Lat Pulldown", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000004"), Name = "Single Arm Lat Pulldown", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000005"), Name = "Seated Cable Row", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000006"), Name = "Machine Row", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000007"), Name = "Chest Supported Machine Row", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000008"), Name = "Plate Loaded Row", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000009"), Name = "T-Bar Row", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000010"), Name = "Assisted Pull Up Machine", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("51000000-0000-0000-0000-000000000011"), Name = "Back Extension Machine", Category = "Machine", DefaultUnit = "lb" },

            // =========================
            // Machines - Legs
            // =========================
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000001"), Name = "Leg Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000002"), Name = "Horizontal Leg Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000003"), Name = "45 Degree Leg Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000004"), Name = "Hack Squat", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000005"), Name = "V-Squat Machine", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000006"), Name = "Smith Machine Squat", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000007"), Name = "Smith Machine Bench Press", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000008"), Name = "Smith Machine Romanian Deadlift", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000009"), Name = "Leg Extension", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000010"), Name = "Seated Leg Curl", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000011"), Name = "Lying Leg Curl", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000012"), Name = "Standing Leg Curl", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000013"), Name = "Hip Thrust Machine", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000014"), Name = "Hip Abductor Machine", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000015"), Name = "Hip Adductor Machine", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000016"), Name = "Standing Calf Raise Machine", Category = "Machine", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("52000000-0000-0000-0000-000000000017"), Name = "Seated Calf Raise Machine", Category = "Machine", DefaultUnit = "lb" },

            // =========================
            // Cables
            // =========================
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000001"), Name = "Cable Fly", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000002"), Name = "High to Low Cable Fly", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000003"), Name = "Low to High Cable Fly", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000004"), Name = "Cable Lateral Raise", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000005"), Name = "Cable Rear Delt Fly", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000006"), Name = "Cable Curl", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000007"), Name = "Cable Triceps Pushdown", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000008"), Name = "Rope Triceps Pushdown", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000009"), Name = "Overhead Cable Triceps Extension", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000010"), Name = "Cable Crunch", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000011"), Name = "Cable Pull Through", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000012"), Name = "Cable Kickback", Category = "Cable", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("60000000-0000-0000-0000-000000000013"), Name = "Face Pull", Category = "Cable", DefaultUnit = "lb" },

            // =========================
            // Bodyweight / Weighted Bodyweight
            // =========================
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000001"), Name = "Pull Up", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000002"), Name = "Weighted Pull Up", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000003"), Name = "Chin Up", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000004"), Name = "Weighted Chin Up", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000005"), Name = "Dip", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000006"), Name = "Weighted Dip", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000007"), Name = "Push Up", Category = "Bodyweight", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("70000000-0000-0000-0000-000000000008"), Name = "Weighted Push Up", Category = "Bodyweight", DefaultUnit = "lb" },

            // =========================
            // Strongman / Specialty
            // =========================
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000001"), Name = "Farmer's Carry", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000002"), Name = "Yoke Walk", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000003"), Name = "Log Press", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000004"), Name = "Axle Deadlift", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000005"), Name = "Axle Clean and Press", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000006"), Name = "Atlas Stone", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000007"), Name = "Sandbag Carry", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000008"), Name = "Sled Push", Category = "Strongman", DefaultUnit = "lb" },
            new() { Id = Guid.Parse("80000000-0000-0000-0000-000000000009"), Name = "Sled Pull", Category = "Strongman", DefaultUnit = "lb" },

            // =========================
            // Kettlebell
            // =========================
            new() { Id = Guid.Parse("90000000-0000-0000-0000-000000000001"), Name = "Kettlebell Swing", Category = "Kettlebell", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("90000000-0000-0000-0000-000000000002"), Name = "Kettlebell Clean", Category = "Kettlebell", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("90000000-0000-0000-0000-000000000003"), Name = "Kettlebell Snatch", Category = "Kettlebell", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("90000000-0000-0000-0000-000000000004"), Name = "Kettlebell Press", Category = "Kettlebell", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("90000000-0000-0000-0000-000000000005"), Name = "Turkish Get Up", Category = "Kettlebell", DefaultUnit = "kg" },
            new() { Id = Guid.Parse("90000000-0000-0000-0000-000000000006"), Name = "Kettlebell Goblet Squat", Category = "Kettlebell", DefaultUnit = "kg" },
                // =========================
    // More Powerlifting Variations
    // =========================
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000001"), Name = "Competition Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000002"), Name = "Larsen Press", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000003"), Name = "Feet Up Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000004"), Name = "Reverse Grip Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000005"), Name = "Slingshot Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000006"), Name = "Buffalo Bar Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000007"), Name = "Cambered Bar Bench Press", Category = "Powerlifting", DefaultUnit = "lb" },

    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000008"), Name = "Competition Squat", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000009"), Name = "Hatfield Squat", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000010"), Name = "Buffalo Bar Squat", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000011"), Name = "Cambered Bar Squat", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000012"), Name = "Belt Squat", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000013"), Name = "Anderson Squat", Category = "Powerlifting", DefaultUnit = "lb" },

    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000014"), Name = "Competition Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000015"), Name = "Snatch Grip Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000016"), Name = "Banded Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000017"), Name = "Chain Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000018"), Name = "Halting Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("11000000-0000-0000-0000-000000000019"), Name = "Dimel Deadlift", Category = "Powerlifting", DefaultUnit = "lb" },

    // =========================
    // Olympic Weightlifting Accessories
    // =========================
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000001"), Name = "Muscle Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000002"), Name = "Tall Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000003"), Name = "Snatch Pull", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000004"), Name = "Snatch High Pull", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000005"), Name = "Overhead Squat", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000006"), Name = "Snatch Balance", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000007"), Name = "Drop Snatch", Category = "Olympic Weightlifting", DefaultUnit = "kg" },

    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000008"), Name = "Clean Pull", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000009"), Name = "Clean High Pull", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000010"), Name = "Tall Clean", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000011"), Name = "Muscle Clean", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000012"), Name = "Front Rack Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000013"), Name = "Behind the Neck Jerk", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000014"), Name = "Jerk Dip", Category = "Olympic Weightlifting", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("21000000-0000-0000-0000-000000000015"), Name = "Jerk Drive", Category = "Olympic Weightlifting", DefaultUnit = "kg" },

    // =========================
    // Barbell Lower Body / Glutes
    // =========================
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000001"), Name = "Barbell Hip Thrust", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000002"), Name = "Barbell Glute Bridge", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000003"), Name = "Barbell Lunge", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000004"), Name = "Barbell Reverse Lunge", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000005"), Name = "Barbell Bulgarian Split Squat", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000006"), Name = "Barbell Step Up", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000007"), Name = "Good Morning", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000008"), Name = "Seated Good Morning", Category = "Barbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("31000000-0000-0000-0000-000000000009"), Name = "Jefferson Deadlift", Category = "Barbell", DefaultUnit = "lb" },

    // =========================
    // More Dumbbell Variations
    // =========================
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000001"), Name = "Flat Dumbbell Press", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000002"), Name = "Single Arm Dumbbell Bench Press", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000003"), Name = "Neutral Grip Dumbbell Bench Press", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000004"), Name = "Arnold Press", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000005"), Name = "Single Arm Dumbbell Shoulder Press", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000006"), Name = "Dumbbell Front Raise", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000007"), Name = "Incline Dumbbell Curl", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000008"), Name = "Preacher Dumbbell Curl", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000009"), Name = "Concentration Curl", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000010"), Name = "Dumbbell Triceps Extension", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000011"), Name = "Dumbbell Skull Crusher", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000012"), Name = "Dumbbell Shrug", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000013"), Name = "Dumbbell Step Up", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000014"), Name = "Dumbbell Reverse Lunge", Category = "Dumbbell", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("41000000-0000-0000-0000-000000000015"), Name = "Dumbbell Hip Thrust", Category = "Dumbbell", DefaultUnit = "lb" },

    // =========================
    // Landmine
    // =========================
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000001"), Name = "Landmine Press", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000002"), Name = "Single Arm Landmine Press", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000003"), Name = "Landmine Row", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000004"), Name = "Meadows Row", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000005"), Name = "Landmine Squat", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000006"), Name = "Landmine Deadlift", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000007"), Name = "Landmine RDL", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000008"), Name = "Landmine Hack Squat", Category = "Landmine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("43000000-0000-0000-0000-000000000009"), Name = "Landmine Rotation", Category = "Landmine", DefaultUnit = "lb" },

    // =========================
    // More Machines - Chest/Shoulders/Arms
    // =========================
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000001"), Name = "Hammer Strength Chest Press", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000002"), Name = "Hammer Strength Incline Press", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000003"), Name = "Hammer Strength Shoulder Press", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000004"), Name = "Machine Dip", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000005"), Name = "Triceps Extension Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000006"), Name = "Biceps Curl Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000007"), Name = "Preacher Curl Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000008"), Name = "Machine Lateral Raise", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("53000000-0000-0000-0000-000000000009"), Name = "Machine Shrug", Category = "Machine", DefaultUnit = "lb" },

    // =========================
    // More Machines - Back
    // =========================
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000001"), Name = "Hammer Strength Row", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000002"), Name = "Hammer Strength High Row", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000003"), Name = "Hammer Strength Low Row", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000004"), Name = "Iso-Lateral Row", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000005"), Name = "Iso-Lateral Pulldown", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000006"), Name = "Pullover Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("54000000-0000-0000-0000-000000000007"), Name = "Reverse Pec Deck", Category = "Machine", DefaultUnit = "lb" },

    // =========================
    // More Machines - Legs
    // =========================
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000001"), Name = "Pendulum Squat", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000002"), Name = "Power Squat Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000003"), Name = "Belt Squat Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000004"), Name = "Glute Drive Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000005"), Name = "Glute Kickback Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000006"), Name = "Donkey Calf Raise Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000007"), Name = "Tibia Raise Machine", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000008"), Name = "Single Leg Press", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000009"), Name = "Single Leg Extension", Category = "Machine", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("55000000-0000-0000-0000-000000000010"), Name = "Single Leg Curl", Category = "Machine", DefaultUnit = "lb" },

    // =========================
    // More Cables
    // =========================
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000001"), Name = "Cable Row", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000002"), Name = "Single Arm Cable Row", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000003"), Name = "Straight Arm Pulldown", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000004"), Name = "Cable Upright Row", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000005"), Name = "Cable Y Raise", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000006"), Name = "Cable External Rotation", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000007"), Name = "Cable Internal Rotation", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000008"), Name = "Cable Woodchopper", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000009"), Name = "Cable Pallof Press", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000010"), Name = "Cable Hip Abduction", Category = "Cable", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("61000000-0000-0000-0000-000000000011"), Name = "Cable Hip Adduction", Category = "Cable", DefaultUnit = "lb" },

    // =========================
    // Calisthenics / Skills
    // =========================
    new() { Id = Guid.Parse("71000000-0000-0000-0000-000000000001"), Name = "Muscle Up", Category = "Bodyweight", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("71000000-0000-0000-0000-000000000002"), Name = "Weighted Muscle Up", Category = "Bodyweight", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("71000000-0000-0000-0000-000000000003"), Name = "Ring Dip", Category = "Bodyweight", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("71000000-0000-0000-0000-000000000004"), Name = "Weighted Ring Dip", Category = "Bodyweight", DefaultUnit = "lb" },


    // =========================
    // More Strongman / Specialty
    // =========================
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000001"), Name = "Farmer's Hold", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000002"), Name = "Suitcase Carry", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000003"), Name = "Frame Carry", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000004"), Name = "Husafell Carry", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000005"), Name = "Sandbag Load", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000006"), Name = "Sandbag Over Shoulder", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000007"), Name = "Stone Load", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000008"), Name = "Log Clean and Press", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000009"), Name = "Circus Dumbbell Press", Category = "Strongman", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("81000000-0000-0000-0000-000000000010"), Name = "Tire Flip", Category = "Strongman", DefaultUnit = "lb" },

    // =========================
    // More Kettlebell
    // =========================
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000001"), Name = "Double Kettlebell Swing", Category = "Kettlebell", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000002"), Name = "Double Kettlebell Clean", Category = "Kettlebell", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000003"), Name = "Double Kettlebell Press", Category = "Kettlebell", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000004"), Name = "Kettlebell Clean and Press", Category = "Kettlebell", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000005"), Name = "Kettlebell Front Squat", Category = "Kettlebell", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000006"), Name = "Kettlebell Farmer's Carry", Category = "Kettlebell", DefaultUnit = "kg" },
    new() { Id = Guid.Parse("91000000-0000-0000-0000-000000000007"), Name = "Kettlebell Windmill", Category = "Kettlebell", DefaultUnit = "kg" },

    // =========================
    // Core / Abs
    // =========================
    new() { Id = Guid.Parse("A0000000-0000-0000-0000-000000000001"), Name = "Weighted Sit Up", Category = "Core", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("A0000000-0000-0000-0000-000000000002"), Name = "Decline Sit Up", Category = "Core", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("A0000000-0000-0000-0000-000000000004"), Name = "Weighted Plank", Category = "Core", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("A0000000-0000-0000-0000-000000000005"), Name = "Russian Twist", Category = "Core", DefaultUnit = "lb" },

    // =========================
    // Grip / Forearms / Neck
    // =========================
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000001"), Name = "Wrist Curl", Category = "Grip", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000002"), Name = "Reverse Wrist Curl", Category = "Grip", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000003"), Name = "Reverse Curl", Category = "Grip", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000004"), Name = "Plate Pinch", Category = "Grip", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000006"), Name = "Weighted Dead Hang", Category = "Grip", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000007"), Name = "Grip Crusher", Category = "Grip", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000008"), Name = "Neck Flexion", Category = "Neck", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000009"), Name = "Neck Extension", Category = "Neck", DefaultUnit = "lb" },
    new() { Id = Guid.Parse("B0000000-0000-0000-0000-000000000010"), Name = "Neck Harness Extension", Category = "Neck", DefaultUnit = "lb" },

            // =========================
            // Non-Judged / Custom Sentinel
            // =========================
            new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000000"), Name = "Non-Judged Lift", Category = "Custom", DefaultUnit = "lb" },
        };

        db.Lifts.AddRange(lifts);
        await db.SaveChangesAsync();
    }
}