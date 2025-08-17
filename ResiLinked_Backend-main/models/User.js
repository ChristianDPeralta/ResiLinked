const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    mobileNo: { type: String, required: true },
    barangay: { type: String, required: true }, // which barangay the user is from
    idType: { type: String, required: true }, // "National ID", "Barangay ID", etc.
    idNumber: { type: String, required: true },
    idFrontImage: { type: String }, // URL/path to image
    idBackImage: { type: String },
    skills: [{ type: String }], // e.g., ["magaling maglaba", "carpentry"]
    userType: { type: String, enum: ['employee', 'employer', 'both'], required: true },
    isVerified: { type: Boolean, default: false }, // Barangay official verification
    gender: { type: String, enum: ['Male', 'Female', 'others'] },
    profilePicture: { type: String, default: "" },
    goals: [{
        targetAmount: Number,
        progress: { type: Number, default: 0 },
        description: String
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);