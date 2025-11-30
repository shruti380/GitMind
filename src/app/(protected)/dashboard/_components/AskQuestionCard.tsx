"use client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import useProject from "~/hooks/use-project";
import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import useRefetch from "~/hooks/use-refetch";
import { askQuestion } from "../actions";
import CodeReferences from "./CodeReferences";
import { Loader2 } from "lucide-react";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();

  // Ref to track if stream is active (refs don't cause re-renders)
  const isStreamingRef = React.useRef(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer("");
    setFilesReferences([]);
    e.preventDefault();
    if (!project?.id) return;

    setLoading(true);
    setOpen(true);
    isStreamingRef.current = true; // Mark streaming as active

    try {
      const result = await askQuestion(question, project.id);

      console.log("Ask question result:", result);

      if (!result || !result.output) {
        throw new Error("Invalid response from askQuestion");
      }

      const { output, filesReferences } = result;

      // Set file references after we have them
      if (filesReferences && filesReferences.length > 0) {
        setFilesReferences(filesReferences);
      }

      // Consume the stream with timeout protection
      console.log("Starting to consume stream...");
      let chunkCount = 0;
      let streamCompleted = false;
      let lastChunkTime = Date.now();
      const CHUNK_TIMEOUT = 10000; // 10 seconds between chunks

      try {
        // Add a timeout checker
        const timeoutChecker = setInterval(() => {
          const timeSinceLastChunk = Date.now() - lastChunkTime;
          if (timeSinceLastChunk > CHUNK_TIMEOUT && !streamCompleted) {
            console.warn(
              `Stream timeout: no chunk received for ${timeSinceLastChunk}ms`,
            );
            clearInterval(timeoutChecker);
          }
        }, 1000);

        for await (const delta of output) {
          lastChunkTime = Date.now();
          chunkCount++;
          console.log(`Stream chunk ${chunkCount}:`, delta);

          if (delta) {
            setAnswer((ans) => ans + delta);
          }
        }

        clearInterval(timeoutChecker);
        streamCompleted = true;
        console.log(
          `✅ Stream completed successfully. Total chunks: ${chunkCount}`,
        );
      } catch (streamError) {
        console.error("❌ Error consuming stream:", streamError);

        // If we got some content, don't throw - just log and finish
        if (chunkCount > 0) {
          console.warn(
            `⚠️ Stream interrupted but ${chunkCount} chunks received`,
          );
          streamCompleted = true;
        } else {
          throw streamError;
        }
      } finally {
        // Always set loading to false when stream processing ends
        setLoading(false);
        isStreamingRef.current = false; // Mark streaming as inactive
        console.log(
          `🏁 Stream processing ended. Total chunks: ${chunkCount}. Loading set to false.`,
        );
      }

      if (!streamCompleted && chunkCount === 0) {
        throw new Error("No content received from stream");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get answer. Please try again.");
      setOpen(false);
      setLoading(false);
      isStreamingRef.current = false; // Mark streaming as inactive
      setAnswer("");
      setFilesReferences([]);
    }
  };

  const handleSaveAnswer = () => {
    if (!project?.id || !answer) {
      toast.error("No answer to save");
      return;
    }

    saveAnswer.mutate(
      {
        projectId: project.id,
        question,
        answer,
        filesReferences,
      },
      {
        onSuccess: () => {
          toast.success("Answer saved successfully!");
          refetch();
        },
        onError: (error) => {
          console.error("Error saving answer:", error);
          toast.error("Failed to save answer!");
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[90vh] w-full max-w-[95vw] flex-col bg-white dark:bg-gray-900">
          <DialogHeader className="flex-shrink-0 border-b pb-4">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                GitMind AI Response
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={saveAnswer.isPending || loading || !answer}
                onClick={handleSaveAnswer}
              >
                {saveAnswer.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Answer"
                )}
              </Button>
            </div>
            <DialogDescription className="mt-2 rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <strong className="text-gray-900 dark:text-white">
                Question:
              </strong>{" "}
              {question}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex-1 overflow-hidden">
            {!answer ? (
              <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-600" />
                  <p className="text-gray-600 dark:text-gray-300">
                    GitMind is thinking...
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full w-full">
                <div
                  data-color-mode="light"
                  className="min-h-full bg-white p-6 dark:bg-gray-900"
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MDEditor.Markdown
                      source={answer}
                      style={{
                        background: "transparent",
                        color: "inherit",
                      }}
                    />
                  </div>

                  {loading && (
                    <div className="mt-4 flex items-center gap-2 rounded bg-blue-50 p-2 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Still generating...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {filesReferences.length > 0 && answer && (
            <div className="mt-4 flex-shrink-0 rounded-lg border-t bg-gray-50 p-4 pt-4 dark:bg-gray-800">
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Code References:
              </h3>
              <ScrollArea className="max-h-[200px]">
                <CodeReferences filesReferences={filesReferences} />
              </ScrollArea>
            </div>
          )}

          <div className="mt-4 flex flex-shrink-0 justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setAnswer("");
                setFilesReferences([]);
                setQuestion("");
                setLoading(false); // Reset loading state
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="h-4" />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asking GitMind...
                </>
              ) : (
                "Ask GitMind"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
