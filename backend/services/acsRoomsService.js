const { RoomsClient } = require("@azure/communication-rooms");
const { AzureCommunicationTokenCredential } = require("@azure/communication-common"); // ADD THIS

const connectionString = process.env.ACS_CONNECTION_STRING;
const roomsClient = new RoomsClient(connectionString);

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
  getRoom,
  deleteRoom,
};