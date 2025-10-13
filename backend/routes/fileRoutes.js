const express = require("express");
const router = express.Router();
const { BlobServiceClient } = require("@azure/storage-blob");
const { authMiddleware } = require("../middleware/authMiddleware");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "warroom-documents";

// Serve document with authentication
router.get("/files/:caseId/:fileName", authMiddleware, async (req, res) => {
  try {
    const { caseId, fileName } = req.params;

    // TODO: Verify user has access to this case
    // (check if attorney owns case OR juror is approved)

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(fileName);

    const downloadResponse = await blobClient.download();

    // Set appropriate content type
    res.setHeader(
      "Content-Type",
      downloadResponse.contentType || "application/octet-stream"
    );
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    downloadResponse.readableStreamBody.pipe(res);
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
});

module.exports = router;
