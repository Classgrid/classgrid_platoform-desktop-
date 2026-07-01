import React, { useState } from "react";
import { X, Book, Users } from "lucide-react";
import { useCreateClassroom } from "../queries/useCreateClassroom";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Spinner } from "@/components/marketing_ui/spinner";

type CreateClassroomModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateClassroomModal({ isOpen, onClose }: CreateClassroomModalProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [maxStudents, setMaxStudents] = useState("200");
  const [allowRequests, setAllowRequests] = useState(true);

  const { mutate: createClassroom, isPending } = useCreateClassroom();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClassroom(
      {
        name,
        subject,
        description,
        settings: {
          maxStudents: parseInt(maxStudents) || 200,
          allowJoinRequests: allowRequests } },
      {
        onSuccess: () => {
          onClose();
          // Reset form
          setName("");
          setSubject("");
          setDescription("");
        } }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Classroom</h2>
            <p className="text-sm text-muted-foreground mt-1">Set up a new digital learning space.</p>
          </div>
          <Button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Classroom Name *</label>
            <Input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms A1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject *</label>
            <div className="relative">
              <Book className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="text"
                required
                placeholder="e.g. Computer Science"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description (Optional)</label>
            <textarea
              placeholder="Brief overview of what this class covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Max Students</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Input
                  type="checkbox"
                  checked={allowRequests}
                  onChange={(e) => setAllowRequests(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Allow Join Requests</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name || !subject}>
              {isPending ? (
                <>
                  <className="mr-2 h-4 w-4 " /> Creating...
                </>
              ) : (
                "Create Classroom"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
