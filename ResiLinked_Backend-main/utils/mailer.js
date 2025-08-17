const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends verification email to new users
 * @param {string} email - User's email address
 * @param {string} userId - User's MongoDB _id
 */
const sendVerificationEmail = async (email, userId) => {
    try {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${userId}`;
        
        const mailOptions = {
            from: `ResiLinked <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your ResiLinked Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0066ee;">Welcome to ResiLinked!</h2>
                    <p>Please verify your email address to complete your registration:</p>
                    <a href="${verificationLink}" 
                       style="display: inline-block; background: #0066ee; color: white; 
                              padding: 10px 20px; text-decoration: none; border-radius: 5px;
                              margin: 15px 0;">
                        Verify Email Address
                    </a>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Sends password reset email
 * @param {string} to - Recipient email
 * @param {string} resetLink - Password reset link
 */
const sendResetEmail = async (to, resetLink) => {
    try {
        await transporter.sendMail({
            from: `ResiLinked <${process.env.EMAIL_USER}>`,
            to,
            subject: "ResiLinked Password Reset",
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetLink}">Reset Password</a>
                    <p>This link expires in 30 minutes.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Password reset email error:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetEmail
};