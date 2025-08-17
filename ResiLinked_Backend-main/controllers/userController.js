const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('goals');

        if (!user) {
            return res.status(404).json({ 
                message: "User not found",
                alert: "Your profile could not be found"
            });
        }

        res.status(200).json({
            user,
            alert: "Profile loaded successfully"
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error fetching profile", 
            error: err.message,
            alert: "Failed to load profile"
        });
    }
};

exports.editProfile = async (req, res) => {
    try {
        const updates = req.body;
        
        // Handle profile picture upload if present
        if (req.file) {
            updates.profilePicture = req.file.buffer.toString('base64');
        }

        const originalUser = await User.findById(req.user.id);
        const user = await User.findByIdAndUpdate(
            req.user.id, 
            updates, 
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                message: "User not found",
                alert: "Your profile could not be found"
            });
        }

        const changes = {};
        Object.keys(updates).forEach(key => {
            if (originalUser[key] !== user[key]) {
                changes[key] = {
                    from: originalUser[key],
                    to: user[key]
                };
            }
        });

        if (Object.keys(changes).length > 0) {
            await createNotification({
                recipient: user._id,
                type: 'profile_update',
                message: 'Your profile was updated'
            });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user,
            changes: Object.keys(changes).length > 0 ? changes : undefined,
            alert: "Profile updated successfully"
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error updating profile", 
            error: err.message,
            alert: "Failed to update profile"
        });
    }
};

exports.setGoal = async (req, res) => {
    try {
        const { targetAmount, description } = req.body;
        
        if (!targetAmount || !description) {
            return res.status(400).json({
                message: "Missing required fields",
                required: ["targetAmount", "description"],
                alert: "Please fill all required fields"
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                message: "User not found",
                alert: "Your profile could not be found"
            });
        }

        user.goals.push({ 
            targetAmount, 
            description, 
            progress: 0,
            createdAt: new Date()
        });
        await user.save();

        await createNotification({
            recipient: user._id,
            type: 'goal_created',
            message: `New goal set: ${description} (₱${targetAmount})`
        });

        res.status(200).json({
            message: "Goal set successfully",
            goals: user.goals,
            alert: "New goal added to your profile"
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error setting goal", 
            error: err.message,
            alert: "Failed to set goal"
        });
    }
};