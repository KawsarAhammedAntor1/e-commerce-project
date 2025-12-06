const dotenv = require('dotenv');
dotenv.config();
const sendEmail = require('./utils/emailService');

const testEmail = async () => {
    console.log('Testing with User:', process.env.SMTP_EMAIL);
    console.log('Password Length:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 'undefined');

    try {
        await sendEmail({
            to: 'girlsfashionbd321@gmail.com', // Sending to self for test
            subject: 'Test Email from Nodemailer',
            text: 'Hello, this is a test email from your Express app!',
            html: '<h1>Hello!</h1><p>This is a test email from your Express app!</p>',
        });
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error.message);
        if (error.response) console.error('SMTP Response:', error.response);
        if (error.code) console.error('Error Code:', error.code);
    }
};

testEmail();
