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
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
    try {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
        
        const mailOptions = {
            from: `ResiLinked <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your ResiLinked Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #8a3ffc;">Welcome to ResiLinked!</h2>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.5;">Thank you for registering with ResiLinked. Please verify your email address to continue with your registration:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                          style="display: inline-block; background: #8a3ffc; color: white; 
                                 padding: 12px 25px; text-decoration: none; border-radius: 5px;
                                 font-size: 16px; font-weight: bold;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">After verifying your email, your account will need to be approved by an administrator before you can log in.</p>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">This verification link will expire in 24 hours.</p>
                    
                    <p style="font-size: 14px; color: #666;">If you didn't create this account, please ignore this email.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e4; text-align: center; font-size: 12px; color: #999;">
                        &copy; ${new Date().getFullYear()} ResiLinked. All rights reserved.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
        console.error('❌ Verification email error:', error);
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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0066ee;">Password Reset Request</h2>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" 
                       style="display: inline-block; background: #ff6600; color: white; 
                              padding: 10px 20px; text-decoration: none; border-radius: 5px;
                              margin: 15px 0;">
                        Reset Password
                    </a>
                    <p>This link will expire in 30 minutes.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                </div>
            `
        });
        console.log(`✅ Password reset email sent to ${to}`);
    } catch (error) {
        console.error('❌ Password reset email error:', error);
        throw new Error('Failed to send password reset email');
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetEmail
};
