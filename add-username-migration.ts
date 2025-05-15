import { connectToDatabase } from "@/lib/mongodb";
import AudioClip from "@/models/AudioClip";
import User from "@/models/User";
import mongoose from "mongoose";

async function migrateUsernames() {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected to database");

    // Find all AudioClip documents that don't have a username
    const clips = await AudioClip.find({
      $or: [
        { uploadedByUsername: { $exists: false } },
        { uploadedByUsername: null },
      ],
    });

    console.log(`Found ${clips.length} clips without usernames`);

    let updated = 0;
    let skipped = 0;

    for (const clip of clips) {
      try {
        if (!clip.uploadedBy) {
          console.log(`Clip ${clip._id} has no uploadedBy ID, skipping`);
          skipped++;
          continue;
        }

        // Find the user by ID
        const user = await User.findById(clip.uploadedBy);

        if (!user) {
          console.log(
            `User not found for clip ${clip._id}, using "Unknown" as username`
          );
          clip.uploadedByUsername = "Unknown";
        } else {
          console.log(
            `Setting username for clip ${clip._id} to "${user.name}"`
          );
          clip.uploadedByUsername = user.name;
        }

        await clip.save();
        updated++;
      } catch (err) {
        console.error(`Error updating clip ${clip._id}:`, err);
        skipped++;
      }
    }

    console.log(
      `Migration complete: Updated ${updated} clips, skipped ${skipped} clips`
    );
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the migration
migrateUsernames()
  .then(() => console.log("Migration script completed"))
  .catch((err) => console.error("Migration script failed:", err));
