"use client";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Presentation, Upload } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { uploadFile } from "~/lib/firebase";
import { api } from "~/trpc/react";
import useProject from "~/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const MeetingCard = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const router = useRouter();
  const uploadMeeting = api.project.uploadMeeting.useMutation();
  const { project } = useProject();

  const processMeeting = useMutation({
    mutationFn: async (data: {
      meetingUrl: string;
      meetingId: string;
      projectId: string;
    }) => {
      const { meetingUrl, meetingId, projectId } = data;
      const response = await axios.post("/api/process-meeting", {
        meetingUrl,
        meetingId,
        projectId,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 50_000_000,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      console.log(
        "DROP TRIGGERED - Accepted:",
        acceptedFiles.length,
        "Rejected:",
        rejectedFiles.length,
      );

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection?.errors[0]?.code === "file-too-large") {
          toast.error("File is too large. Maximum size is 50MB");
        } else if (rejection?.errors[0]?.code === "file-invalid-type") {
          toast.error("Invalid file type. Please upload MP3, WAV, or M4A");
        } else {
          toast.error("File was rejected");
        }
        return;
      }

      if (!project) {
        toast.error("No project selected");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) {
        toast.error("No file selected");
        return;
      }

      console.log("Starting upload for:", file.name);
      setIsUploading(true);
      setProgress(0);

      try {
        console.log("Uploading to Firebase...");
        const downloadURL = await uploadFile(file, setProgress);

        if (!downloadURL) {
          throw new Error("Failed to get download URL");
        }

        console.log("Upload complete! URL:", downloadURL);
        console.log("Saving to database...");

        const meeting = await uploadMeeting.mutateAsync({
          projectId: project.id,
          meetingUrl: downloadURL,
          name: file.name,
        });

        console.log("Meeting saved to database:", meeting.id);
        toast.success("Meeting uploaded successfully");

        processMeeting.mutate({
          meetingUrl: downloadURL,
          meetingId: meeting.id,
          projectId: project.id,
        });

        router.push("/meetings");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload meeting",
        );
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
  });

  return (
    <Card className="col-span-2 flex flex-col items-center justify-center p-10">
      <input {...getInputProps()} />
      <div
        {...getRootProps()}
        className="flex w-full cursor-pointer flex-col items-center"
      >
        {!isUploading && (
          <>
            <Presentation className="h-10 w-10 animate-bounce" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              Create a new meeting
            </h3>
            <p className="mt-1 text-center text-sm text-gray-500">
              {isDragActive ? (
                "Drop the file here..."
              ) : (
                <>
                  Analyse your meeting with GitMind.
                  <br />
                  Powered by AI.
                </>
              )}
            </p>
            <div className="mt-6">
              <Button disabled={isUploading || !project} type="button">
                <Upload className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Upload Meeting
              </Button>
            </div>
          </>
        )}

        {isUploading && (
          <div className="flex flex-col items-center gap-4">
            <CircularProgressbar
              value={progress}
              text={`${progress}%`}
              className="size-20"
              styles={buildStyles({
                pathColor: "black",
                textColor: "black",
              })}
            />
            <p className="text-center text-sm text-gray-500">
              Uploading your meeting...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MeetingCard;
