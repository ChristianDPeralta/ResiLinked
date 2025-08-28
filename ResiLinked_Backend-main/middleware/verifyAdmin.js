const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized: no user info" });
  }

  try {
    // Look for an admin record linked to this user
    const adminRecord = await Admin.findOne({ user: req.user.id });

    if (!adminRecord) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Attach admin data (e.g., barangay) for later use
    req.admin = adminRecord;

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      message: "Authorization check failed",
      error: error.message,
    });
  }
};
