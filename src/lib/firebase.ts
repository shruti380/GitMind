// Import the necessary functions from the SDKs
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  StorageError,
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMID5tBLoyrvM82Z-hWrRqPd1g5bPZ3B0",
  authDomain: "gitmind2-b4f6c.firebaseapp.com",
  projectId: "gitmind2-b4f6c",
  storageBucket: "gitmind2-b4f6c.firebasestorage.app",
  messagingSenderId: "472254367422",
  appId: "1:472254367422:web:adc70aef82f192480540ef",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The File object to upload.
 * @param setProgress An optional callback to report upload progress (0-100).
 * @returns A promise that resolves with the public download URL of the file.
 */
export function uploadFile(
  file: File,
  setProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique filename to avoid conflicts
      const timestamp = Date.now();
      const filename = `meetings/${timestamp}_${file.name}`;
      const storageRef = ref(storage, filename);

      console.log("Starting Firebase upload:", filename);

      // Start the upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Listen for state changes, errors, and completion
      uploadTask.on(
        "state_changed",
        // 1. Progress handler
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );

          console.log(`Upload progress: ${progress}%`);

          if (setProgress) {
            setProgress(progress);
          }

          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
          }
        },
        // 2. Error handler
        (error: StorageError) => {
          console.error("Firebase upload failed:", error);
          reject(error);
        },
        // 3. Completion handler
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Upload complete! URL:", downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error("Failed to get download URL:", error);
            reject(error);
          }
        },
      );
    } catch (error) {
      console.error("Firebase upload setup failed:", error);
      reject(error);
    }
  });
}
