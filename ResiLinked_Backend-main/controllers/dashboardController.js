const User = require('../models/User');
const Job = require('../models/Job');
const Rating = require('../models/Rating');

exports.barangayStats = async (req, res) => {
    try {
        const { barangay } = req.query;
        if (!barangay) {
            return res.status(400).json({
                message: "Barangay parameter is required",
                alert: "Please specify a barangay"
            });
        }

        // Fetch users and jobs
        const [users, jobs] = await Promise.all([
            User.find({ barangay }),
            Job.find({ barangay })
        ]);

        // Normalize gender counts
        let male = 0, female = 0, others = 0;
        users.forEach(u => {
            const g = (u.gender || "").toLowerCase().trim();
            if (g === "male" || g === "m") male++;
            else if (g === "female" || g === "f") female++;
            else others++;
        });

        // Top 5 skills
        const topSkills = {};
        users.forEach(u => {
            (u.skills || []).forEach(skill => {
                topSkills[skill] = (topSkills[skill] || 0) + 1;
            });
        });

        const sortedSkills = Object.entries(topSkills)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        res.status(200).json({
            totalUsers: users.length,
            totalJobs: jobs.length,
            genderDistribution: { male, female, others },
            topSkills: sortedSkills,
            recentJobs: jobs.slice(0, 5),
            alert: `Statistics loaded for ${barangay}`
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error fetching barangay stats", 
            error: err.message,
            alert: "Failed to load barangay statistics"
        });
    }
};
