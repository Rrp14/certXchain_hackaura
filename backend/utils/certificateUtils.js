import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { uploadToIPFS } from './ipfsUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a unique certificate ID
 * @returns {Promise<string>} The generated certificate ID
 */
export const generateCertificateId = async () => {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex');
  return `CERT-${timestamp}-${random}`;
};

/**
 * Generate certificate HTML content
 * @param {Object} certificate The certificate object
 * @param {Object} template The template object
 * @returns {string} The generated HTML content
 */
export const generateCertificateHTML = (certificate, template) => {
  console.log('Generating HTML for certificate:', {
    studentName: certificate.studentName,
    course: certificate.course,
    date: certificate.date,
    institution: certificate.institution
  });

  const { customCSS, customHTML, fields, institutionLogo, authorizedSignature, seal } = template;
  const { 
    studentName, 
    course, 
    date, 
    customFields,
    certificateId,
    institution
  } = certificate;

  // Convert image URLs to base64 if they're not already
  const getImageData = (imageUrl) => {
    if (!imageUrl) {
      console.log('No image URL provided');
      return '';
    }
    
    console.log('Processing image path:', imageUrl);
    console.log('Current working directory:', process.cwd());
    
    // If it's already a base64 string, return it
    if (imageUrl.startsWith('data:image')) {
      console.log('Image is already base64 encoded');
      return imageUrl;
    }
    
    // If it's a file path, try to read it
    try {
      // Clean the path
      const cleanPath = imageUrl.replace(/^\/+/, '');
      
      // Define possible paths to check
      const possiblePaths = [
        path.join(process.cwd(), cleanPath),
        path.join(process.cwd(), 'uploads', cleanPath),
        path.join(process.cwd(), 'uploads', 'templates', cleanPath),
        path.join(process.cwd(), 'uploads', path.basename(cleanPath)),
        path.join(process.cwd(), 'uploads', 'templates', path.basename(cleanPath))
      ];

      console.log('Trying possible paths:', possiblePaths);

      // Try each path
      for (const p of possiblePaths) {
        console.log('Checking path:', p);
        if (fs.existsSync(p)) {
          console.log('Found image at:', p);
          const imageBuffer = fs.readFileSync(p);
          console.log('Image buffer size:', imageBuffer.length);
          
          // Determine image type from file extension
          const ext = path.extname(p).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 
                          ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                          ext === '.gif' ? 'image/gif' : 'image/png';
          
          const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          console.log('Successfully converted image to base64, length:', base64Image.length);
          return base64Image;
        }
      }
      
      console.log('Image not found in any of the possible paths');
      return '';
    } catch (error) {
      console.error('Error processing image:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        path: imageUrl
      });
      return '';
    }
  };

  console.log('Processing template images:', {
    hasLogo: !!institutionLogo,
    hasSignature: !!authorizedSignature,
    hasSeal: !!seal,
    logoPath: institutionLogo,
    signaturePath: authorizedSignature,
    sealPath: seal
  });

  const logoData = getImageData(institutionLogo);
  const signatureData = getImageData(authorizedSignature);
  const sealData = getImageData(seal);

  console.log('Image data processed:', {
    logoLength: logoData ? logoData.length : 0,
    signatureLength: signatureData ? signatureData.length : 0,
    sealLength: sealData ? sealData.length : 0,
    logoData: logoData ? 'Present' : 'Missing',
    signatureData: signatureData ? 'Present' : 'Missing',
    sealData: sealData ? 'Present' : 'Missing'
  });

  // Use custom HTML if provided, otherwise use default template
  let html = customHTML || `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificate</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .certificate {
            background-color: white;
            padding: 20px;
            width: 297mm;
            height: 210mm;
            position: relative;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .logo {
            max-height: 60px;
            max-width: 200px;
            margin-bottom: 5px;
            display: inline-block;
            object-fit: contain;
          }
          .institution-name {
            color: #2c3e50;
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
          }
          h1 {
            color: #2c3e50;
            margin: 5px 0;
            font-size: 28px;
          }
          h2 {
            color: #34495e;
            margin: 10px 0;
            font-size: 22px;
          }
          h3 {
            color: #7f8c8d;
            margin: 8px 0;
            font-size: 18px;
          }
          p {
            color: #555;
            line-height: 1.4;
            font-size: 16px;
            margin: 4px 0;
          }
          .certificate-id {
            margin-top: 10px;
            font-size: 12px;
            color: #95a5a6;
          }
          .verification-info {
            margin-top: 8px;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 4px;
          }
          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 10px 0;
            min-height: 0;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 10px 40px;
            height: 100px;
            margin-top: auto;
          }
          .signature {
            text-align: center;
            flex: 1;
          }
          .signature img {
            max-height: 50px;
            max-width: 150px;
            margin-bottom: 5px;
            display: block;
            object-fit: contain;
          }
          .seal {
            text-align: center;
            flex: 1;
          }
          .seal img {
            max-height: 70px;
            max-width: 150px;
            display: block;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            ${logoData ? `<img src="${logoData}" alt="Institution Logo" class="logo">` : ''}
            <div class="institution-name">${institution}</div>
            <h1>Certificate of Completion</h1>
          </div>
          
          <div class="content">
            <p>This is to certify that</p>
            <h2>${studentName}</h2>
            <p>has successfully completed the course</p>
            <h3>${course}</h3>
            <p>Issued on: ${new Date(date).toLocaleDateString()}</p>
            <p class="certificate-id">Certificate ID: ${certificateId}</p>
            
            <div class="verification-info">
              <p>Issued by: ${institution}</p>
            </div>
          </div>

          <div class="footer">
            <div class="signature">
              ${signatureData ? `<img src="${signatureData}" alt="Authorized Signature">` : ''}
              <p>Authorized Signature</p>
            </div>
            <div class="seal">
              ${sealData ? `<img src="${sealData}" alt="Official Seal">` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Replace custom fields
  if (fields) {
    fields.forEach(field => {
      const value = customFields?.[field.name] || '';
      html = html.replace(new RegExp(`{{${field.name}}}`, 'g'), value);
    });
  }

  // Add custom CSS
  if (customCSS) {
    html = `<style>${customCSS}</style>${html}`;
  }

  console.log('Generated HTML content length:', html.length);
  return html;
};

/**
 * Generate certificate PDF from HTML template
 * @param {Object} certificate The certificate object
 * @param {Object} template The template object
 * @returns {Promise<Buffer>} The generated PDF buffer
 */
export const generateCertificatePDF = async (certificate, template) => {
  try {
    console.log('Starting PDF generation for certificate:', {
      studentName: certificate.studentName,
      course: certificate.course,
      date: certificate.date
    });

    // Generate HTML content using the template
    const htmlContent = generateCertificateHTML(certificate, template);

    // Create a temporary HTML file
    const tempHtmlPath = path.join(__dirname, '..', 'temp', 'certificate.html');
    const tempDir = path.dirname(tempHtmlPath);
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write HTML to file
    fs.writeFileSync(tempHtmlPath, htmlContent);
    console.log('HTML file written to:', tempHtmlPath);

    // Launch puppeteer
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport size to A4 landscape
    await page.setViewport({ width: 1123, height: 794 }); // A4 landscape dimensions in pixels

    // Load the HTML file
    console.log('Loading HTML file in Puppeteer...');
    await page.goto(`file://${tempHtmlPath}`, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    // Add a small delay to ensure all resources are loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      preferCSSPageSize: true
    });

    // Clean up
    await browser.close();
    fs.unlinkSync(tempHtmlPath);
    console.log('Temporary files cleaned up');

    // Verify the PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }

    console.log('PDF generated successfully:', {
      size: pdfBuffer.length,
      firstBytes: pdfBuffer.slice(0, 10).toString('hex')
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate certificate PDF: ' + error.message);
  }
};

/**
 * Generate and upload certificate PDF to IPFS
 * @param {Object} certificate The certificate object
 * @param {Object} template The template object
 * @returns {Promise<string>} The IPFS hash
 */
export const generateAndUploadCertificate = async (certificate, template) => {
  try {
    // Generate PDF using the template
    const pdfBuffer = await generateCertificatePDF(certificate, template);
    
    // Save PDF locally for debugging
    const tempPdfPath = path.join(__dirname, '..', 'temp', `${certificate.certificateId}.pdf`);
    const tempDir = path.dirname(tempPdfPath);
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write PDF to file
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log('PDF saved to:', tempPdfPath);

    // Upload to IPFS
    const ipfsHash = await uploadToIPFS(pdfBuffer, `${certificate.certificateId}.pdf`);
    console.log('Certificate uploaded to IPFS with hash:', ipfsHash);

    // Clean up temp file
    fs.unlinkSync(tempPdfPath);

    return ipfsHash;
  } catch (error) {
    console.error('Error generating and uploading certificate:', error);
    throw new Error('Failed to generate and upload certificate');
  }
}; 