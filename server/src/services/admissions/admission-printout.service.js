import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { uploadFile } from "../../config/supabaseClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates the Admission Printout PDF (A4 format).
 * Features: Student photo placeholder, barcode/QR code, signatures.
 * 
 * @param {Object} application The populated AdmissionApplication document
 * @param {Object} org The populated Organization document 
 * @returns {Promise<string>} S3/Supabase public URL for the generated PDF
 */
export const generateAdmissionPrintout = async (application, org) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', async () => {
                const pdfData = Buffer.concat(buffers);
                
                // Upload to Supabase `notes-files` (reusing existing bucket)
                const fileName = `admission_printouts/${org._id}/${application._id}_${Date.now()}.pdf`;
                
                try {
                    const fileObj = {
                        originalname: "Admission_Form.pdf",
                        mimetype: "application/pdf",
                        buffer: pdfData
                    };
                    
                    const uploadResult = await uploadFile('notes-files', fileName, fileObj);
                    resolve(uploadResult.publicUrl);
                } catch (uploadObjErr) {
                    console.error("PDF upload failure.", uploadObjErr);
                    reject(uploadObjErr);
                }
            });

            // --- 1. Header (Org Info) ---
            doc.fontSize(20).font("Helvetica-Bold").text(org.name || "Classgrid Institution", { align: "center" });
            doc.fontSize(10).font("Helvetica").text(org.address?.line1 || "", { align: "center" });
            doc.text(`Contact: ${org.phone || "N/A"} | Email: ${org.email || "N/A"}\n\n`, { align: "center" });
            
            doc.moveTo(50, 110).lineTo(545, 110).stroke();
            doc.moveDown();

            // --- 2. Title & QR Code ---
            doc.fontSize(16).font("Helvetica-Bold").text("ADMISSION APPLICATION FORM", { align: "center" });
            
            // Generate QR Code containing the Application ID
            try {
                const qrDataUrl = await QRCode.toDataURL(application._id.toString());
                const qrImageBuffer = Buffer.from(qrDataUrl.split(",")[1], 'base64');
                doc.image(qrImageBuffer, 460, 120, { fit: [60, 60] });
                doc.fontSize(8).text(`APP ID: ${application._id.toString().substring(18, 24)}`, 460, 185);
            } catch (qrErr) {
                console.warn("Could not generate QR inline.", qrErr);
            }
            
            // --- 3. Photo Placeholder ---
            doc.rect(50, 130, 100, 120).stroke();
            doc.fontSize(8).text("Paste Passport\nSize Photo Here", 60, 180, { width: 80, align: "center" });
            
            doc.moveDown(5);

            // --- 4. Student Data ---
            const dataY = 270;
            let currentY = dataY;
            const drawRow = (label, value) => {
                doc.font("Helvetica-Bold").fontSize(10).text(label, 50, currentY);
                doc.font("Helvetica").text(value || "N/A", 200, currentY);
                currentY += 20;
            };

            drawRow("Application Number", application._id.toString());
            drawRow("Student Full Name", application.full_name);
            drawRow("Phone / Mobile", application.phone);
            drawRow("Email Address", application.email);
            
            const dobString = application.dob ? new Date(application.dob).toLocaleDateString() : 'N/A';
            drawRow("Date of Birth", dobString);
            
            // Dynamic form data
            if (application.form_data) {
                // Ignore these as they're handled
                const ignoreKeys = ['full_name', 'phone', 'email', 'dob', 'entry_mode'];
                for (const [key, val] of Object.entries(application.form_data)) {
                    if (ignoreKeys.includes(key)) continue;
                    
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    drawRow(label, String(val));
                }
            }

            // --- 5. Signatures Region ---
            // Move near bottom
            const bottomY = 700;
            doc.moveTo(50, bottomY - 20).lineTo(545, bottomY - 20).stroke();
            
            doc.font("Helvetica-Bold").fontSize(10);
            doc.text("_________________________", 50, bottomY);
            doc.text("Parent / Guardian Signature", 50, bottomY + 15);
            
            doc.text("_________________________", 220, bottomY);
            doc.text("Student Signature", 220, bottomY + 15);
            
            doc.text("_________________________", 390, bottomY);
            doc.text("Office Verification Stamp", 390, bottomY + 15);

            // Finalize PDF
            doc.end();

        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
};
