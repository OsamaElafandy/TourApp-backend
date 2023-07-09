
const nodemailer = require('nodemailer');

const senEmail = options => {
    // 1) Create a transporter
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "b7687b5f59562e",
          pass: "e66a0db383f539"
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'Osama <>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    }

    // 3) Actually send the email
    transport.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
}

module.exports = senEmail;