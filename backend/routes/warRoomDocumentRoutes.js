const express = require("express");
const multer = require("multer");
const { poolPromise } = require("../config/db");
const path = require("path");
const { uploadToBlob, getBlobClient } = require("../utils/azureBlob");
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const router = express.Router();

// Configure multer with file size limit and file filter
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (increased for video support)
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      // Videos
      'video/mp4',
      'video/mpeg',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/x-ms-wmv', // .wmv
      'video/webm',
      'video/x-flv', // .flv
      'video/3gpp', // .3gp
      // Documents
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain',
      'text/csv',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`));
    }
  }
});

// Helper function to generate SAS URL
async function generateSasUrl(fileUrl) {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "warroom-documents";

    // Extract blob name from URL
    const urlParts = fileUrl.split("/");
    const blobName = urlParts[urlParts.length - 1];

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(
      decodeURIComponent(blobName)
    );

    const sasOptions = {
      containerName,
      blobName: decodeURIComponent(blobName),
      permissions: BlobSASPermissions.parse("r"), // read only
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      blobServiceClient.credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error("SAS generation error:", error);
    return fileUrl; // Return original URL as fallback
  }
}

// Helper function to detect file type
function detectFileType(filename, mimetype) {
  const fileExt = path.extname(filename).toLowerCase();
  
  // Image types
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"].includes(fileExt)) {
    return "image";
  }
  
  // Video types
  if ([".mp4", ".mpeg", ".mov", ".avi", ".wmv", ".webm", ".flv", ".3gp"].includes(fileExt) ||
      mimetype.startsWith("video/")) {
    return "video";
  }
  
  // PDF
  if (fileExt === ".pdf") {
    return "pdf";
  }
  
  // Word documents
  if ([".doc", ".docx"].includes(fileExt) || 
      mimetype === "application/msword" || 
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "word";
  }
  
  // Excel documents
  if ([".xls", ".xlsx"].includes(fileExt) ||
      mimetype === "application/vnd.ms-excel" ||
      mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return "excel";
  }
  
  // PowerPoint documents
  if ([".ppt", ".pptx"].includes(fileExt) ||
      mimetype === "application/vnd.ms-powerpoint" ||
      mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    return "powerpoint";
  }
  
  // Default to document
  return "document";
}

// POST - Upload document
router.post(
  "/cases/:caseId/documents",
  upload.single("file"),
  async (req, res) => {
    const { caseId } = req.params;
    const { description } = req.body;
    const file = req.file;

    console.log("=== DOCUMENT UPLOAD DEBUG ===");
    console.log("Case ID:", caseId);
    console.log("File received:", file ? file.originalname : "No file");
    console.log("File size:", file ? file.size : "N/A");
    console.log("MIME type:", file ? file.mimetype : "N/A");
    console.log("Description:", description);

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      console.log("Uploading to Azure Blob Storage...");
      
      // Upload to Azure Blob
      const fileUrl = await uploadToBlob(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      console.log("Upload successful! File URL:", fileUrl);

      // Detect type from extension and MIME type
      const type = detectFileType(file.originalname, file.mimetype);
      console.log("Detected file type:", type);

      // Save to database
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("caseId", caseId)
        .input("type", type)
        .input("fileName", file.originalname)
        .input("fileUrl", fileUrl)
        .input("description", description || "")
        .input("size", file.size)
        .input("mimeType", file.mimetype).query(`
        INSERT INTO WarRoomDocuments (CaseId, Type, FileName, FileUrl, Description, Size, MimeType, UploadedAt)
        VALUES (@caseId, @type, @fileName, @fileUrl, @description, @size, @mimeType, GETUTCDATE())
      `);

      console.log("Database insert successful!");

      res.json({
        success: true,
        message: "File uploaded successfully",
        fileUrl,
        caseId,
        type,
      });
    } catch (err) {
      console.error("=== DOCUMENT UPLOAD ERROR ===");
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      console.error("File details:", {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
      
      res.status(500).json({ 
        error: err.message,
        details: "Failed to upload document. Check server logs for details."
      });
    }
  }
);

// GET - Fetch all documents for a case with SAS URLs
router.get("/cases/:caseId/documents", async (req, res) => {
  const { caseId } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT Id, CaseId, Type, FileName, FileUrl, Description, Size, MimeType, UploadedAt
        FROM WarRoomDocuments
        WHERE CaseId = @caseId
        ORDER BY UploadedAt DESC
      `);

    // Generate SAS URLs for each document
    const documentsWithSas = await Promise.all(
      result.recordset.map(async (doc) => ({
        ...doc,
        FileUrl: await generateSasUrl(doc.FileUrl),
      }))
    );

    res.json(documentsWithSas);
  } catch (err) {
    console.error("Fetch documents error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Delete document
router.delete("/cases/:caseId/documents/:docId", async (req, res) => {
  const { caseId, docId } = req.params;

  try {
    const pool = await poolPromise;

    // Get document info from database
    const result = await pool
      .request()
      .input("docId", docId)
      .input("caseId", caseId).query(`
        SELECT Id, FileUrl, FileName
        FROM WarRoomDocuments
        WHERE Id = @docId AND CaseId = @caseId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = result.recordset[0];

    // Delete from Azure Blob Storage
    try {
      const blobClient = getBlobClient(doc.FileUrl);
      await blobClient.deleteIfExists();
    } catch (blobErr) {
      console.error("Blob deletion error:", blobErr);
      // Continue with DB deletion even if blob deletion fails
    }

    // Delete from database
    await pool.request().input("docId", docId).query(`
        DELETE FROM WarRoomDocuments WHERE Id = @docId
      `);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ error: err.message || "Delete failed" });
  }
});

module.exports = router;