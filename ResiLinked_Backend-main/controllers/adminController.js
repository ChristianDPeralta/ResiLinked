const fs = require('fs'); // needed for PDF deletion
const User = require('../models/User');
const Job = require('../models/Job');
const Rating = require('../models/Rating');
const Report = require('../models/Report');
const { generateUserReport } = require('../utils/pdfGenerator');
const { createNotification } = require('../utils/notificationHelper');

// Dashboard summary
exports.getDashboard = async (req, res) => {
    try {
        const [totalUsers, totalJobs, totalRatings, totalReports] = await Promise.all([
            User.countDocuments(),
            Job.countDocuments(),
            Rating.countDocuments(),
            Report.countDocuments()
        ]);

        res.status(200).json({ totalUsers, totalJobs, totalRatings, totalReports });
    } catch (err) {
        res.status(500).json({ message: "Dashboard error", error: err.message });
    }
};

// Search/filter users
exports.searchUsers = async (req, res) => {
    try {
        const { q, sortBy = 'lastName', order = 'asc', page = 1, limit = 10 } = req.query;
        let query = {};

        if (q) {
            query.$or = [
                { firstName: new RegExp(q, 'i') },
                { lastName: new RegExp(q, 'i') },
                { email: new RegExp(q, 'i') },
                { mobileNo: new RegExp(q, 'i') }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(query)
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(limit)
                .select('-password'),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            searchTerm: q || 'All users',
            sortedBy: `${sortBy} (${order})`,
            alert: `Found ${total} matching users`
        });
    } catch (err) {
        res.status(500).json({ message: "Error searching users", error: err.message, alert: "Search operation failed" });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found", alert: "No user found with that ID" });
        }

        await createNotification({
            recipient: req.user.id,
            type: 'admin_message',
            message: `User ${user.email} has been deleted by ${req.user.email}`
        });

        res.status(200).json({
            message: "User deleted successfully",
            deletedUser: { id: user._id, email: user.email, name: `${user.firstName} ${user.lastName}` },
            alert: "User account permanently deleted"
        });
    } catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err.message, alert: "Failed to delete user account" });
    }
};

// Edit user
exports.editUser = async (req, res) => {
    try {
        const originalUser = await User.findById(req.params.id);
        if (!originalUser) {
            return res.status(404).json({ message: "User not found", alert: "No user found with that ID" });
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (originalUser[key] !== updatedUser[key]) {
                changes[key] = { from: originalUser[key], to: updatedUser[key] };
            }
        });

        if (changes.email) {
            await createNotification({
                recipient: updatedUser._id,
                type: 'admin_message',
                message: `Your email was updated to ${updatedUser.email} by admin`
            });
        }

        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
            changes,
            alert: Object.keys(changes).length > 0 ? "User profile updated" : "No changes detected"
        });
    } catch (err) {
        res.status(500).json({ message: "Error editing user", error: err.message, alert: "Failed to update user profile" });
    }
};

// Delete job
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ message: "Job not found", alert: "No job found with that ID" });
        }

        await createNotification({
            recipient: job.postedBy,
            type: 'job_update',
            message: `Your job "${job.title}" was removed by admin`
        });

        res.status(200).json({
            message: "Job deleted successfully",
            deletedJob: { id: job._id, title: job.title, postedBy: job.postedBy },
            alert: "Job permanently deleted"
        });
    } catch (err) {
        res.status(500).json({ message: "Error deleting job", error: err.message, alert: "Failed to delete job" });
    }
};

// Edit job
exports.editJob = async (req, res) => {
    try {
        const originalJob = await Job.findById(req.params.id);
        if (!originalJob) {
            return res.status(404).json({ message: "Job not found", alert: "No job found with that ID" });
        }

        const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (originalJob[key] !== updatedJob[key]) {
                changes[key] = { from: originalJob[key], to: updatedJob[key] };
            }
        });

        if (Object.keys(changes).length > 0) {
            await createNotification({
                recipient: updatedJob.postedBy,
                type: 'job_update',
                message: `Your job "${updatedJob.title}" was updated by admin`,
                relatedJob: updatedJob._id
            });
        }

        res.status(200).json({
            message: "Job updated successfully",
            job: updatedJob,
            changes,
            alert: Object.keys(changes).length > 0 ? "Job details updated" : "No changes detected"
        });
    } catch (err) {
        res.status(500).json({ message: "Error editing job", error: err.message, alert: "Failed to update job" });
    }
};

// Download users as PDF
exports.downloadUsersPdf = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const filename = generateUserReport(users);

        await createNotification({
            recipient: req.user.id,
            type: 'admin_message',
            message: `User report PDF generated with ${users.length} records`
        });

        res.download(filename, `ResiLinked-Users-${new Date().toISOString().split('T')[0]}.pdf`, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlinkSync(filename);
        });
    } catch (err) {
        res.status(500).json({ message: "Error generating PDF", error: err.message, alert: "Failed to generate user report" });
    }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                alert: "No user found with that ID"
            });
        }

        res.status(200).json({
            success: true,
            user,
            alert: "User retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Error fetching user",
            error: err.message,
            alert: "Failed to fetch user"
        });
    }
};
