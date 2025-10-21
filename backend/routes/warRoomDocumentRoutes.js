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
const upload = multer();

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

// POST - Upload document
router.post(
  "/cases/:caseId/documents",
  upload.single("file"),
  async (req, res) => {
    const { caseId } = req.params;
    const { description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // Upload to Azure Blob
      const fileUrl = await uploadToBlob(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Detect type from extension
      const fileExt = path.extname(file.originalname).toLowerCase();
      let type = "document";
      if (
        [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"].includes(
          fileExt
        )
      ) {
        type = "image";
      } else if (fileExt === ".pdf") {
        type = "pdf";
      }

      // Save to database
      const pool = await poolPromise;
      await pool
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

      res.json({
        success: true,
        message: "File uploaded successfully",
        fileUrl,
        caseId,
        type,
      });
    } catch (err) {
      console.error("Document upload error:", err);
      res.status(500).json({ error: err.message });
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
