const nodemailer = require('nodemailer');

const sendEmail = async (option) => {

    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "12f965be2377b2",
            pass: "7f77a3c24daca6"
        }
    });

    const mail = {
        from: "E-Shop",
        to: option.userEmail,
        subject: option.subject,
        text: option.text,
        html: option.html,
    }

    await transport.sendMail(mail);
}

module.exports = sendEmail;