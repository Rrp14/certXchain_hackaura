import nodemailer from 'nodemailer';
import { getGatewayURL, extractCID } from './ipfsUtils.js';
import { generateCertificatePDF } from './certificateUtils.js';

let transporter = null;

export const initializeEmailConfig = () => {
  // Debug logging for environment variables
  console.log('Email Utils - Environment variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' : 'Not Set');

  // Configure email transporter for Gmail
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verify email configuration
  return new Promise((resolve, reject) => {
    transporter.verify(function(error, success) {
      if (error) {
        console.error('Email configuration error:', error);
        console.log('Email config:', {
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS ? '****' : 'Not Set'
        });
        reject(error);
      } else {
        console.log('Email server is ready to send messages');
        resolve();
      }
    });
  });
};

/**
 * Send an email using the configured transporter
 * @param {Object} mailOptions - The email options (from, to, subject, html)
 * @returns {Promise} - A promise that resolves when the email is sent
 */
export const sendEmail = async (mailOptions) => {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send email notification for issued certificate
 * @param {string} studentEmail - The email address of the student
 * @param {Object} certificateData - The certificate data
 * @param {Object} template - The certificate template
 * @returns {Promise<void>}
 */
export const sendCertificateIssuedEmail = async (studentEmail, certificateData, template) => {
  try {
    if (!studentEmail) {
      throw new Error('Student email is required');
    }

    const { studentName, course, certificateId, institution } = certificateData;
    const verificationUrl = certificateData.verificationUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificateId}`;

    console.log('Generating PDF certificate...');
    // Generate PDF certificate
    const pdfBuffer = await generateCertificatePDF({
      ...certificateData,
      template
    }, template);
    console.log('PDF generated successfully');

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: studentEmail,
      subject: 'Your Certificate Has Been Issued',
      html: `
        <h1>Certificate Issued Successfully!</h1>
        <p>Dear ${studentName},</p>
        <p>Your certificate for the course ${course} has been issued by ${institution}.</p>
        <p>Certificate ID: ${certificateId}</p>
        <p>You can verify your certificate using the link below:</p>
        <p><a href="${verificationUrl}" target="_blank">Verify Certificate</a></p>
        <p>This certificate is stored on the blockchain and can be verified using the Certificate ID.</p>
        <p>Best regards,<br>${institution}</p>
      `,
      attachments: [
        {
          filename: `certificate-${certificateId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log('Sending email with PDF attachment...');
    await transporter.sendMail(mailOptions);
    console.log('Certificate issued email sent successfully');
  } catch (error) {
    console.error('Error sending certificate issued email:', error);
    throw new Error('Failed to send certificate issued email');
  }
}; 