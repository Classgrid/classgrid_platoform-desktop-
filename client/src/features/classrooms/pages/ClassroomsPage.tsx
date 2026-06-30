import React, { useState, useMemo } from "react";
import { Loader2, Plus, Search, BookOpen, Clock, Users } from "lucide-react";


import { useMyClassrooms, MyClassroomRecord } from "../queries/useMyClassrooms";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { CreateClassroomModal } from "../components/CreateClassroomModal";

import { Button } from "@/components/marketing_ui/button";

export function ClassroomsPage() {
  const { data: user } = useCurrentUser();
  const { data: classroomsData, isLoading } = useMyClassrooms();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const classrooms = classroomsData?.classrooms ?? [];

  const filteredClassrooms = useMemo(() => {
    if (!search.trim()) return classrooms;
    const lowerSearch = search.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.subject?.toLowerCase().includes(lowerSearch) ||
        c.teacher?.name.toLowerCase().includes(lowerSearch)
    );
  }, [classrooms, search]);

  const isTeacher = user?.role === "teacher" || user?.role === "faculty";

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your classrooms...</p>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl mx-auto pb-12">
      <div
        title="My Classrooms"
        description={
          isTeacher
            ? "Manage your active classes, view students, and handle join requests."
            : "Access your enrolled classes, assignments, and study materials."
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search classrooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            <div onClick={() => isTeacher && setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {isTeacher ? "Create Class" : "Join Class"}
            </div>
          </div>
        }
      />

      {filteredClassrooms.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No Classrooms Found</h3>
          <p className="mt-2 text-muted-foreground max-w-sm">
            {isTeacher
              ? "You haven't created any classrooms yet. Create your first class to start teaching."
              : "You haven't joined any classrooms yet. Click 'Join Class' to enter a class code."}
          </p>
          {isTeacher ? (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus size={16} />
              Create Class
            </Button>
          ) : (
            <div className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Join Class
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard key={classroom._id} classroom={classroom} isTeacher={isTeacher} />
          ))}
        </div>
      )}

      <CreateClassroomModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}

function ClassroomCard({ classroom, isTeacher }: { classroom: MyClassroomRecord; isTeacher: boolean }) {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-purple-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];
  const gradient = gradients[classroom.name.length % gradients.length];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
      <div className={`h-24 w-full bg-gradient-to-r ${gradient} relative`}>
        {classroom.coverImage && (
          <img 
            src={classroom.coverImage} 
            alt="Cover" 
            className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60" 
          />
        )}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {classroom.name}
          </h3>
          {!isTeacher && classroom.membershipStatus === "pending" && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
              <Clock size={10} /> Pending
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
          {classroom.subject || "General Subject"}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
          {isTeacher ? (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5" title="Enrolled Students">
                <Users size={14} />
                {classroom.memberCount || 0}
              </span>
              {classroom.pendingRequests ? (
                <span className="flex items-center gap-1.5 text-warning font-medium" title="Pending Requests">
                  <Clock size={14} />
                  {classroom.pendingRequests}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {classroom.teacher?.profilePicture ? (
                <img 
                  src={classroom.teacher.profilePicture} 
                  alt={classroom.teacher.name} 
                  className="h-6 w-6 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {classroom.teacher?.name.charAt(0)}
                </div>
              )}
              <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                {classroom.teacher?.name || "Unknown Teacher"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
