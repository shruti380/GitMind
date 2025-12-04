"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import useProject from "~/hooks/use-project";
import React from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

const InviteButton = () => {
  const { projectId } = useProject();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 border-gray-700 bg-gray-900 p-0 text-white sm:max-w-[600px]">
          <DialogHeader className="space-y-3 px-6 pb-4 pt-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
              Invite Team Members
            </DialogTitle>
            <p className="text-sm font-normal text-gray-400">
              Share this link with your team members to give them access to the
              project
            </p>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <Input
                  readOnly
                  value={inviteLink}
                  className="flex-1 cursor-pointer border-0 bg-white font-mono text-sm text-black focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={handleCopy}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 border-gray-600 bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Anyone with this link can join your project
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button size="sm" onClick={() => setOpen(true)}>
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
