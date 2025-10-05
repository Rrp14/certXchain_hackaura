import Certificate from '../models/certificate.model.js';
import Institution from '../models/Institution.js';
import Template from '../models/template.model.js';
import { generateCertificateId, generateCertificatePDF } from '../utils/certificateUtils.js';
import { issueCertificate as issueOnBlockchain } from '../utils/blockchainUtils.js';
import { uploadToIPFS, getGatewayURL, extractCID } from '../utils/ipfsUtils.js';
import { sendCertificateIssuedEmail } from '../utils/emailUtils.js';
import PDFDocument from 'pdfkit';
import { verifyCertificate as verifyOnBlockchain } from '../utils/blockchainUtils.js';
import path from 'path';
import fs from 'fs';

// Issue a new certificate
export const issueCertificate = async (req, res) => {
  try {
    const {
      studentName,
      studentEmail,
      course,
      templateId,
      customFields,
      date
    } = req.body;

    // Get institution details from auth token
    const institution = req.institution;
    if (!institution) {
      return res.status(401).json({ message: 'Institution not found' });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    // Get template details
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Store certificate details on blockchain
    console.log('Storing certificate details on blockchain...');
    const certificateData = {
      certificateId,
      studentName,
      studentEmail,
      course,
      institution: institution.name,
      date: date || new Date(),
      customFields
    };

    // Store certificate data on blockchain
    const blockchainData = await issueOnBlockchain(certificateData, institution);
    console.log('Blockchain storage result:', blockchainData);

    // Create certificate in database with blockchain data
    const certificate = new Certificate({
      certificateId,
      studentName,
      studentEmail,
      course,
      institution: institution._id,
      template: templateId,
      customFields,
      status: 'issued',
      date: date || new Date(),
      blockchainTx: blockchainData.transactionHash,
      blockchainData: {
        ...blockchainData,
        certificateData
      }
    });

    // Save the certificate and verify the status was set
    await certificate.save();
    console.log('Certificate saved with status:', certificate.status);

    // Verify the certificate was saved correctly
    const savedCertificate = await Certificate.findOne({ certificateId });
    if (!savedCertificate || savedCertificate.status !== 'issued') {
      console.error('Certificate status verification failed:', {
        found: !!savedCertificate,
        status: savedCertificate?.status
      });
      throw new Error('Failed to save certificate with correct status');
    }

    try {
      // Send email notification with PDF attachment
      const emailData = {
        ...certificateData,
        blockchainTx: blockchainData.transactionHash,
        blockchainData,
        verificationUrl: blockchainData.verificationUrl
      };
      await sendCertificateIssuedEmail(studentEmail, emailData, template);
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certificate: {
        ...certificate.toObject(),
        certificateData,
        blockchainTx: blockchainData.transactionHash
      }
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ message: error.message });
  }
};

// Verify a certificate
export const verifyCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Verifying certificate:', id);

    if (!id) {
      console.log('No certificate ID provided');
      return res.status(400).json({ message: 'Certificate ID is required' });
    }

    // Find certificate in database with institution and template details
    const certificate = await Certificate.findOne({ certificateId: id })
      .populate('institution', 'name logo signature seal')
      .populate('template', 'name description fields layout institutionLogo authorizedSignature seal');

    if (!certificate) {
      console.log('Certificate not found:', id);
      return res.status(404).json({ message: 'Certificate not found' });
    }

    console.log('Certificate found:', {
      id: certificate.certificateId,
      institution: certificate.institution ? {
        name: certificate.institution.name,
        logo: certificate.institution.logo,
        signature: certificate.institution.signature,
        seal: certificate.institution.seal
      } : 'No institution data',
      template: certificate.template ? {
        name: certificate.template.name,
        logo: certificate.template.institutionLogo,
        signature: certificate.template.authorizedSignature,
        seal: certificate.template.seal
      } : 'No template data'
    });

    if (certificate.status !== 'issued') {
      console.log('Certificate is not issued:', id);
      return res.status(400).json({ message: 'Certificate has been revoked' });
    }

    // Verify on blockchain
    try {
      console.log('Verifying on blockchain:', id);
      const isValid = await verifyOnBlockchain(id);
      if (!isValid) {
        console.log('Certificate not valid on blockchain:', id);
        return res.status(400).json({ message: 'Certificate is not valid on blockchain' });
      }
    } catch (blockchainError) {
      console.error('Blockchain verification error:', blockchainError);
      // Don't fail if blockchain verification fails, just log the error
    }

    // Get institution details
    const institution = certificate.institution;
    console.log('Processing institution images:', {
      logo: institution.logo,
      signature: institution.signature,
      seal: institution.seal
    });

    // Get template details
    const template = certificate.template;
    console.log('Processing template images:', {
      logo: template.institutionLogo,
      signature: template.authorizedSignature,
      seal: template.seal
    });

    // Prepare certificate data for response
    const certificateData = {
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      course: certificate.course,
      date: certificate.date,
      institution: certificate.institution.name,
      status: certificate.status,
      isValid: true,
      // Use template images instead of institution images
      institutionLogo: template.institutionLogo || null,
      authorizedSignature: template.authorizedSignature || null,
      seal: template.seal || null,
      template: certificate.template
    };

    console.log('Certificate verified successfully:', id);
    console.log('Final image paths:', {
      logo: certificateData.institutionLogo,
      signature: certificateData.authorizedSignature,
      seal: certificateData.seal
    });
    res.json({
      message: 'Certificate is valid',
      certificate: certificateData
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Failed to verify certificate' });
  }
};

// Download a certificate
export const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Downloading certificate:', id);

    // Find certificate and populate institution details
    const certificate = await Certificate.findOne({ certificateId: id })
      .populate('institution', 'name logo signature seal')
      .populate('template', 'html institutionLogo authorizedSignature seal');

    if (!certificate) {
      console.log('Certificate not found:', id);
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Get the institution's assets
    const institution = certificate.institution;
    const template = certificate.template;

    console.log('Institution details:', {
      name: institution.name,
      hasLogo: !!institution.logo,
      hasSignature: !!institution.signature,
      hasSeal: !!institution.seal,
      logoPath: institution.logo,
      signaturePath: institution.signature,
      sealPath: institution.seal
    });

    console.log('Template details:', {
      hasLogo: !!template.institutionLogo,
      hasSignature: !!template.authorizedSignature,
      hasSeal: !!template.seal,
      logoPath: template.institutionLogo,
      signaturePath: template.authorizedSignature,
      sealPath: template.seal
    });

    // Create template object with paths
    const templateData = {
      ...template.toObject(),
      // Use template images if available, otherwise fall back to institution images
      institutionLogo: template.institutionLogo || institution.logo,
      authorizedSignature: template.authorizedSignature || institution.signature,
      seal: template.seal || institution.seal
    };

    // Generate PDF
    console.log('Generating PDF with template data:', {
      logo: templateData.institutionLogo,
      signature: templateData.authorizedSignature,
      seal: templateData.seal
    });

    const pdfBuffer = await generateCertificatePDF(certificate, templateData);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('Generated PDF buffer is empty');
      return res.status(500).json({ message: 'Error generating PDF' });
    }

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateId}.pdf`);
    
    // Send the PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ message: 'Error downloading certificate', error: error.message });
  }
};

// Revoke a certificate
export const revokeCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;

    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    certificate.status = 'revoked';
    certificate.revocationReason = reason;
    certificate.revocationDate = new Date();

    await certificate.save();

    res.json({
      message: 'Certificate revoked successfully',
      certificate
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({ message: 'Failed to revoke certificate' });
  }
};

// Get all certificates for an institution
export const getInstitutionCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ institution: req.institution._id })
      .populate('institution', 'name')
      .sort({ date: -1 });

    res.json(certificates);
  } catch (error) {
    console.error('Error getting institution certificates:', error);
    res.status(500).json({ message: 'Failed to get certificates' });
  }
};