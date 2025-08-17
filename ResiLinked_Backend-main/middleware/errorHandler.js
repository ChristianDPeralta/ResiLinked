const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isBarangayAdmin) {
      return res.status(403).json({ message: 'Barangay admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed', error: error.message });
  }
};