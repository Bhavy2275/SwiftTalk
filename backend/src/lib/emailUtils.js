import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Enable debug logging
});

export const sendVerificationEmail = async (email, otp) => {
  const mailOptions = {
    from: `"SwiftTalk" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'SwiftTalk Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">SwiftTalk Email Verification</h1>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; text-align: center; margin: 0;">
            Your verification code is: <strong style="color: #2563eb; font-size: 24px;">${otp}</strong>
          </p>
        </div>
        <p style="color: #6b7280; text-align: center; margin: 20px 0;">
          This code will expire in 10 minutes.
        </p>
        <p style="color: #6b7280; text-align: center; font-size: 14px;">
          If you didn't request this verification, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    console.log('Attempting to send email to:', email);
    console.log('Using email user:', process.env.EMAIL_USER);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return false;
  }
}; 