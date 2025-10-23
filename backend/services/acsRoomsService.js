const { RoomsClient } = require("@azure/communication-rooms");
const { CommunicationIdentityClient } = require("@azure/communication-identity");
const { ChatClient } = require("@azure/communication-chat");
const { AzureCommunicationTokenCredential } = require("@azure/communication-common");

const connectionString = process.env.ACS_CONNECTION_STRING;
const roomsClient = new RoomsClient(connectionString);
const identityClient = new CommunicationIdentityClient(connectionString);

// Extract ACS endpoint from connection string
const ACS_ENDPOINT = connectionString.match(/endpoint=(https:\/\/[^;]+)/)?.[1] || 
                     process.env.ACS_ENDPOINT;

/**
 * Create a new ACS Room for a trial
 */
async function createRoom(validFrom, validUntil) {
  try {
    // Ensure dates are proper Date objects and in ISO format
    const fromDate = validFrom ? new Date(validFrom) : new Date();
    const untilDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
      console.error("Invalid dates provided:", { validFrom, validUntil });
      throw new Error("Invalid date values provided to createRoom");
    }

    console.log("Creating room with dates - From:", fromDate.toISOString(), "Until:", untilDate.toISOString());

    const createRoomOptions = {
      validFrom: fromDate,
      validUntil: untilDate,
      pstnDialOutEnabled: false,
    };

    const room = await roomsClient.createRoom(createRoomOptions);
    console.log("ACS Room created successfully:", room.id);
    return room;
  } catch (error) {
    console.error("Error creating ACS room:", error);
    throw error;
  }
}

/**
 * Add participant to room
 */
async function addParticipantToRoom(roomId, participantId, role = "Attendee") {
  try {
    const participant = {
      id: { communicationUserId: participantId },
      role: role,
    };

    await roomsClient.addOrUpdateParticipants(roomId, [participant]);
    console.log(`Participant ${participantId} added to room ${roomId} with role ${role}`);
  } catch (error) {
    // Ignore conflict errors - participant already exists
    if (error.statusCode === 409) {
      console.log(`Participant ${participantId} already in room ${roomId} - skipping`);
      return;
    }
    console.error("Error adding participant to room:", error);
    throw error;
  }
}

/**
 * Create a chat thread for the trial
 * Uses a service identity so it's not tied to any specific user
 * RETURNS BOTH chatThreadId AND serviceUserId (IMPORTANT!)
 */
async function createChatThread(topic) {
  try {
    console.log("Creating service identity for chat thread...");
    
    // Create a service identity to own the chat thread
    const serviceIdentity = await identityClient.createUser();
    const serviceToken = await identityClient.getToken(serviceIdentity, ["chat"]);
    
    console.log("Service identity created:", serviceIdentity.communicationUserId);
    
    // Create chat client with service identity
    const credential = new AzureCommunicationTokenCredential(serviceToken.token);
    const chatClient = new ChatClient(ACS_ENDPOINT, credential);
    
    // Create the chat thread
    const createChatThreadResult = await chatClient.createChatThread({
      topic: topic
    });
    
    const chatThreadId = createChatThreadResult.chatThread.id;
    console.log("Chat thread created successfully:", chatThreadId);
    
    return {
      chatThreadId: chatThreadId,
      serviceUserId: serviceIdentity.communicationUserId  // IMPORTANT: Return this!
    };
  } catch (error) {
    console.error("Error creating chat thread:", error);
    throw error;
  }
}

/**
 * Add participant to chat thread
 * Uses the ORIGINAL service identity that created the thread (not a new one!)
 * 
 * @param {string} chatThreadId - The chat thread ID
 * @param {string} chatServiceUserId - The service user ID that created the thread
 * @param {string} participantUserId - The user ID to add
 * @param {string} displayName - Display name for the participant
 */
async function addParticipantToChat(chatThreadId, chatServiceUserId, participantUserId, displayName) {
  try {
    console.log(`Adding ${displayName} to chat thread ${chatThreadId}`);
    console.log(`Using service user ID: ${chatServiceUserId}`);
    
    // Get a fresh token for the ORIGINAL service identity
    const serviceToken = await identityClient.getToken(
      { communicationUserId: chatServiceUserId },
      ["chat"]
    );
    
    const credential = new AzureCommunicationTokenCredential(serviceToken.token);
    const chatClient = new ChatClient(ACS_ENDPOINT, credential);
    const chatThreadClient = chatClient.getChatThreadClient(chatThreadId);
    
    // Add the participant
    await chatThreadClient.addParticipants({
      participants: [
        {
          id: { communicationUserId: participantUserId },
          displayName: displayName
        }
      ]
    });
    
    console.log(`✅ Added ${displayName} to chat thread ${chatThreadId}`);
  } catch (error) {
    // Ignore if participant already exists
    if (error.statusCode === 409 || error.message?.includes("already exists")) {
      console.log(`Participant ${displayName} already in chat - skipping`);
      return;
    }
    console.error("Error adding participant to chat:", error);
    throw error;
  }
}

/**
 * Get room details
 */
async function getRoom(roomId) {
  try {
    const room = await roomsClient.getRoom(roomId);
    return room;
  } catch (error) {
    console.error("Error getting room:", error);
    throw error;
  }
}

/**
 * Delete room
 */
async function deleteRoom(roomId) {
  try {
    await roomsClient.deleteRoom(roomId);
    console.log(`Room ${roomId} deleted`);
  } catch (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
}

module.exports = {
  createRoom,
  addParticipantToRoom,
  createChatThread,
  addParticipantToChat,
  getRoom,
  deleteRoom,
  ACS_ENDPOINT
};