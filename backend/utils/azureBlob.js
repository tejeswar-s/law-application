// filepath: d:\CODING\law-app-6\law-application\backend\utils\azureBlob.js
const { BlobServiceClient } = require("@azure/storage-blob");

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "warroom-documents";

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function uploadToBlob(fileBuffer, fileName, mimeType) {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: mimeType }
  });
  return blockBlobClient.url;
}

// Utility to get a blob client from a file URL
function getBlobClient(fileUrl) {
  // Extract blob name from the URL
  const urlParts = fileUrl.split("/");
  const blobName = urlParts[urlParts.length - 1];
  return containerClient.getBlobClient(blobName);
}

module.exports = { uploadToBlob, getBlobClient };