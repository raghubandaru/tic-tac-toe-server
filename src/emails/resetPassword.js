const sgMail = require('@sendgrid/mail')

const sendgridAPIkey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendgridAPIkey)

function sendResetPasswordEmail(email, link, name) {
  sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'Tic Tac Toe Account Reset Password',
    html: `<p>Hi ${name},</p><p>Your reset password link is here <a href=${link}>Click here to reset password</a><p>`
  })
}

module.exports = {
  sendResetPasswordEmail
}
