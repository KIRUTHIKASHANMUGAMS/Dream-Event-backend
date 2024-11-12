const nodemailer = require('nodemailer');

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendResetPasswordEmail = (to, context) => {
    const mailDetails = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Reset Password',
        text: `You requested a password reset. Your OTP is: ${context.resetLink}`, // Include OTP in the email
    };

    return mailTransporter.sendMail(mailDetails)
        .then(() => console.log('Email sent successfully'))
        .catch((err) => console.log('Error Occurs:', err));
};

