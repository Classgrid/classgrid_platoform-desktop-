import React, { useState } from "react";
import {
  Folder, FileText, Image as ImageIcon, Video, FileArchive,
  File, UploadCloud, FolderPlus, MoreHorizontal, Download,
  Trash2, Edit2, Link as LinkIcon, Search, RefreshCw, Columns, X,
  ChevronRight, List, Check
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Badge } from "@/components/marketing_ui/badge";
import { DataTable } from "@/components/marketing_ui/data-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/marketing_ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/marketing_ui/dialog";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { Spinner } from "@/components/marketing_ui/spinner";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";

import {
  useStorageObjects,
  useUploadFile,
  useCreateFolder,
  useDeleteObject,
  useDeleteObjects,
  useRenameObject,
  storageKeys
} from "../queries/useStorage";
import { storageApi } from "../services/storageApi";
import { useQueryClient } from "@tanstack/react-query";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type?: string) {
  if (!type) return <File size={16} className="text-muted-foreground" />;
  if (type === "Folder") return <Folder size={16} className="text-yellow-500 fill-yellow-500/20" />;
  if (type.startsWith("image/")) return <ImageIcon size={16} className="text-blue-500" />;
  if (type.startsWith("video/")) return <Video size={16} className="text-purple-500" />;
  if (type.includes("pdf")) return <FileText size={16} className="text-red-500" />;
  if (type.includes("zip") || type.includes("tar") || type.includes("rar")) return <FileArchive size={16} className="text-orange-500" />;
  return <File size={16} className="text-muted-foreground" />;
}

// Global upload state to share between the page and columns
export interface UploadingFile {
  id: string;
  file: File;
  name: string;
  prefix: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  xhr?: XMLHttpRequest; // For cancellation, although fetch/axios cancellation is usually AbortController. We'll just fake cancellation for UI purposes if needed, or implement it if API supports it.
}

const FilePreviewPane = ({ activeFile, onClose, onDelete, onRename }: { activeFile: any, onClose: () => void, onDelete: () => void, onRename?: () => void }) => {
  if (!activeFile) return null;
  return (
    <div className="w-[320px] sm:w-[350px] shrink-0 border-l border-border bg-card flex flex-col h-full animate-in slide-in-from-right-2">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-sm">File Preview</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Preview Box */}
        <div className="w-full aspect-square bg-muted/30 rounded-lg border border-border flex items-center justify-center overflow-hidden">
          {activeFile.type?.startsWith("image/") ? (
            <img src={activeFile.cdnUrl} alt={activeFile.name} className="max-w-full max-h-full object-contain" />
          ) : activeFile.type?.startsWith("video/") ? (
            <video src={activeFile.cdnUrl} controls className="max-w-full max-h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <File className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-xs">No preview available</span>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="space-y-4 border border-border/60 bg-muted/20 rounded-xl p-4">
          <div>
            <h3 className="font-semibold text-base break-all">{activeFile.name}</h3>
            <p className="text-sm text-muted-foreground">{activeFile.type || "Unknown"} - {formatBytes(activeFile.size || 0)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Added on</p>
            <p className="text-sm">{(activeFile.createdAt || activeFile.lastModified) ? new Date(activeFile.createdAt || activeFile.lastModified).toLocaleString() : "-"}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last modified</p>
            <p className="text-sm">{activeFile.lastModified ? new Date(activeFile.lastModified).toLocaleString() : "-"}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" className="text-xs h-9 px-4" onClick={async () => {
              try {
                toast.loading("Starting download...", { id: "downloading" });
                const data = await storageApi.getPresignedUrl(activeFile.key);
                const link = document.createElement('a');
                link.href = data.downloadUrl;
                link.download = activeFile.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Download complete", { id: "downloading" });
              } catch (e) {
                toast.dismiss("downloading");
                window.open(activeFile.cdnUrl, '_blank'); // fallback if blocked by CORS
              }
            }}>
              <Download className="mr-2 h-3.5 w-3.5" /> Download
            </Button>
            <Button variant="outline" className="text-xs h-9 px-4" onClick={() => {
              navigator.clipboard.writeText(activeFile.cdnUrl);
              toast.success("URL copied to clipboard");
            }}>
              <LinkIcon className="mr-2 h-3.5 w-3.5" /> Get URL
            </Button>
            {onRename && (
              <Button variant="outline" className="text-xs h-9 px-4" onClick={onRename}>
                <Edit2 className="mr-2 h-3.5 w-3.5" /> Rename
              </Button>
            )}
          </div>
          
          <div className="h-px bg-border w-full my-4" />
          
          <div>
            <Button variant="outline" className="text-xs h-9 px-4 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={onDelete}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete file
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StorageColumn = ({
  prefix,
  isLastColumn,
  selectedChildKey,
  selectedKeys,
  toggleSelection,
  onSelectFolder,
  onSelectFile,
  creatingFolderIn,
  setCreatingFolderIn,
  isCreatingFolderPending,
  handleCreateFolder,
  uploadingFiles,
  handleUploadClick,
  setFileToDelete,
  fileToRename,
  setFileToRename,
  newFileName,
  setNewFileName,
  handleRenameFile,
  isRenamingPending,
}: any) => {
  const { data, isLoading } = useStorageObjects(prefix);
  
  const items = [
    ...(data?.folders || []).map((folder: any) => ({
      isFolder: true,
      key: folder.prefix,
      name: folder.name,
      size: null,
      type: "Folder",
      lastModified: null,
      cdnUrl: ""
    })),
    ...(data?.files || []).map((file: any) => ({
      isFolder: false,
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.contentType,
      lastModified: file.lastModified,
      cdnUrl: file.cdnUrl
    }))
  ];

  
  return (
    <div className="w-[280px] sm:w-[320px] shrink-0 border-r border-border flex flex-col bg-background/50 h-full group relative">
      {/* Sticky Column Header with Hover Actions */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 flex items-center justify-between border-b border-border shadow-sm">
        <span className="text-xs font-semibold text-muted-foreground truncate px-1">
          {prefix === "" ? "Root" : prefix.split('/').slice(-2, -1)[0]}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground" onClick={() => setCreatingFolderIn(prefix)} title="New Folder">
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground" onClick={() => handleUploadClick(prefix)} title="Upload Files">
            <UploadCloud className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {creatingFolderIn === prefix && (
          <div className="flex items-center gap-3 p-2 px-3 border-b border-border bg-primary/5">
            <div className="shrink-0 w-4 h-4" />
            <Folder size={16} className="text-yellow-500 fill-yellow-500/20 shrink-0" />
            <input 
              type="text"
              autoFocus
              defaultValue="Untitled folder"
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-background border border-primary text-sm px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary h-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateFolder(e.currentTarget.value, prefix);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setCreatingFolderIn(null);
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== "Untitled folder") {
                  handleCreateFolder(e.target.value, prefix);
                } else {
                  setCreatingFolderIn(null);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              disabled={isCreatingFolderPending}
              onClick={() => {
                const inputElement = document.getElementById("inline-create-folder-input") as HTMLInputElement;
                if (inputElement) {
                  handleCreateFolder(inputElement.value);
                }
              }}
            >
              <Check size={14} />
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : items.length === 0 && (creatingFolderIn !== prefix) && uploadingFiles.filter((u: any) => u.prefix === prefix).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Folder className="h-10 w-10 opacity-20" />
            <span className="text-sm">This folder is empty.</span>
            <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => handleUploadClick(prefix)}>
              <UploadCloud className="mr-2 h-3.5 w-3.5" /> Upload files
            </Button>
          </div>
        ) : (
          <>
            {/* INLINE UPLOADING FILES */}
            {uploadingFiles.filter((u: any) => u.prefix === prefix).map((u: any) => {
              // If it's completed and already fetched into the list, don't show the inline duplicate
              if (u.status === 'completed' && items.some((item: any) => item.name === u.name)) return null;
              
              return (
                <div 
                  key={u.id}
                  className="flex items-center justify-between p-2 px-3 rounded-md text-sm opacity-70"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 w-4 h-4" /> {/* Empty checkbox space */}
                    {getFileIcon(u.file.type)}
                    <span className="truncate">{u.name}</span>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <Spinner className="text-muted-foreground" />
                  </div>
                </div>
              );
            })}
            
            {/* EXISTING FILES */}
            {items.map((item: any) => {
              if (item.isUpDir) return null;
            
            const isSelected = selectedKeys.has(item.key);
            const isActive = selectedChildKey === item.key; // Is this the folder/file that is currently clicked and opened to the right?

            return (
              <div 
                key={item.key}
                onClick={() => {
                  if (fileToRename?.key === item.key) return; // Prevent navigation while renaming
                  item.isFolder ? onSelectFolder(item.key) : onSelectFile(item);
                }}
                className={`flex items-center justify-between p-2 px-3 rounded-md cursor-pointer text-sm group ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.key); }} className="shrink-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 group-hover:border-foreground/40'}`}>
                      {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </div>
                  
                  {item.isFolder ? <Folder size={18} className="text-yellow-500 fill-yellow-500/20 shrink-0" /> : getFileIcon(item.type)}
                  
                  {fileToRename?.key === item.key ? (
                    <div className="flex items-center flex-1 min-w-0 max-w-full" onClick={e => e.stopPropagation()}>
                      <Input
                        className="h-7 text-sm py-0 px-2 rounded-[4px] bg-background border-primary min-w-[50px] w-full"
                        autoFocus
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameFile();
                          if (e.key === 'Escape') setFileToRename(null);
                        }}
                        disabled={isRenamingPending}
                      />
                      {!item.isFolder && item.name.lastIndexOf('.') > 0 && (
                        <span className="text-muted-foreground ml-0.5 shrink-0">
                          {item.name.substring(item.name.lastIndexOf('.'))}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="truncate selection:bg-transparent">{item.name}</span>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => {
                        const event = new CustomEvent('rename-file', { detail: { key: item.key, name: item.name } });
                        window.dispatchEvent(event);
                      }}>
                        <Edit2 className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const event = new CustomEvent('move-file', { detail: { key: item.key, name: item.name } });
                        window.dispatchEvent(event);
                      }}>
                        <FolderPlus className="mr-2 h-4 w-4" /> Move
                      </DropdownMenuItem>
                      {!item.isFolder && (
                        <>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(item.cdnUrl);
                            toast.success("URL copied to clipboard");
                          }}>
                            <LinkIcon className="mr-2 h-4 w-4" /> Get URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const event = new CustomEvent('download-file', { detail: { key: item.key, name: item.name, cdnUrl: item.cdnUrl } });
                            window.dispatchEvent(event);
                          }}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                        const event = new CustomEvent('delete-file', { detail: item.key });
                        window.dispatchEvent(event);
                      }}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {item.isFolder && (
                  <ChevronRight size={14} className={`shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                )}
              </div>
            );
          })}
          </>
        )}
      </div>
    </div>
  );
};

export function StorageFilesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const [activeFile, setActiveFile] = useState<any | null>(null);

  const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(null);
  const [activeUploadPrefix, setActiveUploadPrefix] = useState<string>("");

  const [fileToRename, setFileToRename] = useState<{ key: string, name: string } | null>(null);
  const [newFileName, setNewFileName] = useState("");
  
  const [fileToMove, setFileToMove] = useState<{ key: string, name: string } | null>(null);
  const [moveDestinationPrefix, setMoveDestinationPrefix] = useState("");
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  const [isNavigateModalOpen, setIsNavigateModalOpen] = useState(false);
  const [navigatePath, setNavigatePath] = useState("");
  
  // Custom upload state
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Miller Columns state
  const [openFolders, setOpenFolders] = useState<string[]>([""]); // "" is root
  
  // The effective prefix is the last opened folder
  const currentPrefix = openFolders[openFolders.length - 1];

  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useStorageObjects(currentPrefix, debouncedSearch);
  const createFolderMutation = useCreateFolder();
  const deleteObjectMutation = useDeleteObject();
  const deleteObjectsMutation = useDeleteObjects();
  const renameObjectMutation = useRenameObject();
  const uploadFileMutation = useUploadFile();

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    const handleRenameFileEvent = (e: any) => {
      setFileToRename({ key: e.detail.key, name: e.detail.name });
      setNewFileName(e.detail.name);
    };

    const handleMoveFileEvent = (e: any) => {
      setFileToMove({ key: e.detail.key, name: e.detail.name });
      setMoveDestinationPrefix(e.detail.key.substring(0, e.detail.key.lastIndexOf('/') + 1));
    };

    const handleDownloadFileEvent = async (e: any) => {
      const { key, name, cdnUrl } = e.detail;
      try {
        toast.loading("Starting download...", { id: "downloading" });
        const data = await storageApi.getPresignedUrl(key);
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download complete", { id: "downloading" });
      } catch (error) {
        toast.dismiss("downloading");
        if (cdnUrl) window.open(cdnUrl, '_blank');
      }
    };

    const handleDeleteFileEvent = (e: any) => {
      setFileToDelete(e.detail);
    };

    window.addEventListener('rename-file', handleRenameFileEvent);
    window.addEventListener('move-file', handleMoveFileEvent);
    window.addEventListener('download-file', handleDownloadFileEvent);
    window.addEventListener('delete-file', handleDeleteFileEvent);

    return () => {
      clearTimeout(handler);
      window.removeEventListener('rename-file', handleRenameFileEvent);
      window.removeEventListener('move-file', handleMoveFileEvent);
      window.removeEventListener('download-file', handleDownloadFileEvent);
      window.removeEventListener('delete-file', handleDeleteFileEvent);
    };
  }, [searchInput]);

  const handleUploadClick = (prefix: string) => {
    setActiveUploadPrefix(prefix);
    fileInputRef.current?.click();
  };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const files = Array.from(e.target.files);
      
      const newUploads = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        prefix: activeUploadPrefix,
        progress: 0,
        status: 'uploading' as const
      }));

      setUploadingFiles(prev => [...prev, ...newUploads]);
      
      let successCount = 0;
      let errorCount = 0;
      const successfullyUploadedFiles: typeof newUploads = [];

      Promise.all(newUploads.map(async (upload) => {
        try {
          await storageApi.uploadFile(upload.file, upload.prefix, (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, progress: percentCompleted } : u));
            }
          });
          
          successCount++;
          successfullyUploadedFiles.push(upload);
          // Set to completed so it can be filtered out from inline display
          setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, status: 'completed' } : u));
          
          // Remove from tracking completely after 2 seconds
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          }, 2000);
        } catch (error) {
          errorCount++;
          setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u));
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          }, 5000);
        }
      })).then(() => {
        // Optimistically insert the uploaded files into the query cache so they show instantly
        if (successfullyUploadedFiles.length > 0) {
          const updateCache = (oldData: any) => {
            if (!oldData) return oldData;
            
            const newFiles = successfullyUploadedFiles.map(u => ({
              key: `${u.prefix}${u.name}`,
              name: u.name,
              size: u.file.size,
              contentType: u.file.type,
              lastModified: new Date().toISOString(),
              cdnUrl: ""
            }));

            const existingKeys = new Set(oldData.files.map((f: any) => f.key));
            const uniqueNewFiles = newFiles.filter(f => !existingKeys.has(f.key));
            
            const updatedOldFiles = oldData.files.map((f: any) => {
              const newFile = newFiles.find(nf => nf.key === f.key);
              return newFile ? newFile : f;
            });

            return {
              ...oldData,
              files: [...updatedOldFiles, ...uniqueNewFiles].sort((a: any, b: any) => a.name.localeCompare(b.name))
            };
          };

          queryClient.setQueryData(storageKeys.list(activeUploadPrefix), updateCache);
          if (debouncedSearch) {
            queryClient.setQueryData(storageKeys.list(activeUploadPrefix, debouncedSearch), updateCache);
          }
        }

        // Globally invalidate so ALL columns refresh in the background
        queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
        queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
        
        // Single unified toast notification
        if (successCount > 0 && errorCount === 0) {
          toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}.`);
        } else if (successCount > 0 && errorCount > 0) {
          toast.warning(`Uploaded ${successCount} file(s), but ${errorCount} failed.`);
        } else if (errorCount > 0) {
          toast.error(`Failed to upload ${errorCount} file(s).`);
        }
      });
      
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

  const handleNavigateToFolder = () => {
    if (!navigatePath) {
      setIsNavigateModalOpen(false);
      return;
    }
    
    // Convert a path like "assignments/math" into openFolders ["", "assignments/", "assignments/math/"]
    const parts = navigatePath.split("/").filter(Boolean);
    const newOpenFolders = [""];
    let current = "";
    
    parts.forEach(part => {
      current += part + "/";
      newOpenFolders.push(current);
    });
    
    setOpenFolders(newOpenFolders);
    setIsNavigateModalOpen(false);
    setNavigatePath("");
  };

  const handleCreateFolder = (folderName: string, targetPrefix: string) => {
    if (createFolderMutation.isPending) return;
    const newFolderName = folderName.trim();
    if (!newFolderName) {
      setCreatingFolderIn(null);
      return;
    }

    const newPrefix = `${targetPrefix}${newFolderName}/`;

    // Instantly hide the input
    setCreatingFolderIn(null);

    // Optimistically update the cache for the Miller columns view (no search term)
    queryClient.setQueryData(storageKeys.list(targetPrefix), (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        folders: [
          ...oldData.folders,
          { name: newFolderName, prefix: newPrefix }
        ].sort((a: any, b: any) => a.name.localeCompare(b.name))
      };
    });

    // Also update the search view cache if the user is currently searching
    if (debouncedSearch) {
      queryClient.setQueryData(storageKeys.list(targetPrefix, debouncedSearch), (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          folders: [
            ...oldData.folders,
            { name: newFolderName, prefix: newPrefix }
          ].sort((a: any, b: any) => a.name.localeCompare(b.name))
        };
      });
    }

    createFolderMutation.mutate({ folderName: newFolderName, prefix: targetPrefix }, {
      onSuccess: () => {
        refetch();
        toast.success("Folder created");
      },
      onError: () => {
        refetch();
        toast.error("Failed to create folder");
      }
    });
  };

  const handleRenameSelection = () => {
    if (selectedKeys.size === 1) {
      const key = Array.from(selectedKeys)[0];
      const file = data?.files?.find(f => f.key === key);
      if (file) {
        setFileToRename({ key: file.key, name: file.name });
        setNewFileName(file.name);
      }
    }
  };

  const handleRenameFile = () => {
    if (renameObjectMutation.isPending) return;
    if (!fileToRename || !newFileName.trim()) {
      if (!newFileName.trim()) setFileToRename(null);
      return;
    }

    const isFolder = fileToRename.key.endsWith('/');
    const lastDotIndex = !isFolder && fileToRename.name.lastIndexOf('.') > 0 ? fileToRename.name.lastIndexOf('.') : -1;
    const extension = lastDotIndex > 0 ? fileToRename.name.substring(lastDotIndex) : "";
    const finalName = newFileName.trim() + extension;

    if (fileToRename.name === finalName) {
      setFileToRename(null);
      return;
    }

    const newKey = fileToRename.key.substring(0, fileToRename.key.lastIndexOf('/') + 1) + finalName;
    renameObjectMutation.mutate({ sourceKey: fileToRename.key, destinationKey: newKey }, {
      onSuccess: () => {
        setFileToRename(null);
        setNewFileName("");
        if (activeFile?.key === fileToRename.key) {
          setActiveFile({
            ...activeFile,
            key: newKey,
            name: newFileName.trim(),
            cdnUrl: activeFile.cdnUrl ? activeFile.cdnUrl.replace(encodeURIComponent(fileToRename.name), encodeURIComponent(newFileName.trim())) : activeFile.cdnUrl
          });
        }
      }
    });
  };

  const handleMoveFile = () => {
    if (!fileToMove) return;
    
    let destPrefix = moveDestinationPrefix.trim();
    if (destPrefix && !destPrefix.endsWith('/')) {
      destPrefix += '/';
    }
    
    const newKey = destPrefix + fileToMove.name;
    
    if (fileToMove.key === newKey) {
      setFileToMove(null);
      return;
    }

    renameObjectMutation.mutate({ sourceKey: fileToMove.key, destinationKey: newKey }, {
      onSuccess: () => {
        setFileToMove(null);
        setMoveDestinationPrefix("");
        if (activeFile?.key === fileToMove.key) {
          setActiveFile(null); 
        }
        refetch();
        toast.success("Moved successfully");
      }
    });
  };

  const handleDeleteFile = () => {
    if (!fileToDelete) return;
    deleteObjectMutation.mutate(fileToDelete, {
      onSuccess: () => {
        setFileToDelete(null);
        const newSet = new Set(selectedKeys);
        newSet.delete(fileToDelete);
        setSelectedKeys(newSet);
        if (activeFile?.key === fileToDelete) setActiveFile(null);
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedKeys.size === 0) return;
    const keysArray = Array.from(selectedKeys);
    deleteObjectsMutation.mutate(keysArray, {
      onSuccess: () => {
        setIsBulkDeleteModalOpen(false);
        setSelectedKeys(new Set());
        setActiveFile(null);
      }
    });
  };

  const copyToClipboard = (url: string, type: string = "URL") => {
    navigator.clipboard.writeText(url);
    toast.success(`${type} copied to clipboard`);
  };

  const toggleSelection = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedKeys);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedKeys(newSet);
  };

  const items = [
    ...(data?.folders || []).map(folder => ({
      isFolder: true,
      key: folder.prefix,
      name: folder.name,
      size: null,
      type: "Folder",
    })),
    ...(data?.files || []).map(file => ({
      isFolder: false,
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.contentType,
      lastModified: file.lastModified,
      cdnUrl: file.cdnUrl
    }))
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col flex-1 w-full border-t border-border overflow-hidden bg-card">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in root directory..."
              className="pl-9 h-9 bg-background border-border shadow-sm text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-background shadow-sm"
              disabled={selectedKeys.size !== 1}
              onClick={handleRenameSelection}
              title="Rename"
            >
              <Edit2 size={16} />
            </Button>
            <RefreshButton
              isFetching={isFetching || isLoading}
              onClick={() => refetch()}
              label={null}
              size="icon"
              className="h-9 w-9 bg-background shadow-sm"
              title="Refresh"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background shadow-sm"
                  title="View options"
                >
                  {viewMode === 'columns' ? <Columns size={16} /> : <List size={16} />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-xl">
                <DropdownMenuItem onClick={() => setViewMode('columns')} className="justify-between">
                  As columns
                  {viewMode === 'columns' && <Check size={16} className="text-emerald-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('list')} className="justify-between">
                  As list
                  {viewMode === 'list' && <Check size={16} className="text-emerald-500" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-5 w-px bg-border mx-1.5"></div>

            <Button
              variant="outline"
              className="h-9 bg-background shadow-sm text-sm font-medium"
              onClick={() => setCreatingFolderIn(currentPrefix)}
            >
              <FolderPlus className="mr-2 h-4 w-4" /> Create folder
            </Button>
            <Button
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 text-sm font-medium ml-0.5"
              onClick={() => handleUploadClick(currentPrefix)}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload files
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={handleFilesSelected}
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden bg-background relative">

          {viewMode === 'columns' ? (
            <>
              {openFolders.map((prefix, i) => (
                <StorageColumn
                  key={prefix}
                  prefix={prefix}
                  isLastColumn={i === openFolders.length - 1}
                  selectedChildKey={openFolders[i + 1]}
                  selectedKeys={selectedKeys}
                  toggleSelection={toggleSelection}
                  onSelectFolder={(key: string) => setOpenFolders([...openFolders.slice(0, i + 1), key])}
                  onSelectFile={(file: any) => setActiveFile(file)}
                  creatingFolderIn={creatingFolderIn}
                  setCreatingFolderIn={setCreatingFolderIn}
                  isCreatingFolderPending={createFolderMutation.isPending}
                  handleCreateFolder={handleCreateFolder}
                  uploadingFiles={uploadingFiles}
                  handleUploadClick={handleUploadClick}
                  setFileToDelete={setFileToDelete}
                  fileToRename={fileToRename}
                  setFileToRename={setFileToRename}
                  newFileName={newFileName}
                  setNewFileName={setNewFileName}
                  handleRenameFile={handleRenameFile}
                  isRenamingPending={renameObjectMutation.isPending}
                />
              ))}

              {/* RIGHT SIDE PREVIEW PANE OR EMPTY SPACE */}
              <div className="flex-1 bg-background flex relative">
                <FilePreviewPane 
                  activeFile={activeFile} 
                  onClose={() => setActiveFile(null)} 
                  onDelete={() => setFileToDelete(activeFile?.key)}
                  onRename={() => {
                    const isFolder = activeFile.key.endsWith('/');
                    const lastDotIndex = !isFolder && activeFile.name.lastIndexOf('.') > 0 ? activeFile.name.lastIndexOf('.') : -1;
                    const baseName = lastDotIndex > 0 ? activeFile.name.substring(0, lastDotIndex) : activeFile.name;
                    setFileToRename({ key: activeFile.key, name: activeFile.name });
                    setNewFileName(baseName);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 w-full overflow-hidden flex flex-col p-4 bg-card">
              <DataTable
                columns={[
                  {
                    key: "select",
                    header: "",
                    width: "40px",
                    render: (_: any, row: any) => {
                      if (row.isUpDir) return null;
                      return (
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border bg-background"
                          checked={selectedKeys.has(row.key)}
                          onChange={(e) => toggleSelection(e as any, row.key)}
                        />
                      );
                    }
                  },
                  {
                    key: "name",
                    header: "Name",
                    accent: true,
                    render: (_: any, row: any) => {
                      const isRenaming = fileToRename?.key === row.key;
                      return (
                        <div
                          className={`flex items-center gap-3 ${row.isFolder || row.isUpDir ? "cursor-pointer hover:underline font-medium" : ""}`}
                          onClick={() => {
                            if (isRenaming) return;
                            if (row.isUpDir) {
                              // legacy list view up dir
                            } else if (row.isFolder) {
                              setOpenFolders([row.key]);
                            } else {
                              setActiveFile(row);
                            }
                          }}
                        >
                          {getFileIcon(row.type)}
                          {isRenaming ? (
                            <div className="flex items-center flex-1 min-w-0 max-w-[300px]" onClick={e => e.stopPropagation()}>
                              <Input
                                className="h-7 text-sm py-0 px-2 rounded-[4px] bg-background border-primary w-full"
                                autoFocus
                                value={newFileName}
                                onChange={e => setNewFileName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameFile();
                                  if (e.key === 'Escape') setFileToRename(null);
                                }}
                                disabled={renameObjectMutation.isPending}
                              />
                              {!row.isFolder && row.name.lastIndexOf('.') > 0 && (
                                <span className="text-muted-foreground ml-0.5 shrink-0">
                                  {row.name.substring(row.name.lastIndexOf('.'))}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span>{row.name}</span>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    key: "size",
                    header: "Size",
                    render: (size: number) => size ? formatBytes(size) : "-"
                  },
                  {
                    key: "type",
                    header: "Type",
                    render: (type: string, row: any) => {
                      if (row.isUpDir) return null;
                      if (type === "Folder") return <Badge variant="neutral">Dir</Badge>;
                      const fileExt = type?.split("/").pop()?.toUpperCase() || "FILE";
                      if (type?.startsWith("image/")) return <Badge variant="info">{fileExt}</Badge>;
                      if (type?.startsWith("video/")) return <Badge variant="secondary">{fileExt}</Badge>;
                      return <Badge variant="outline">{fileExt}</Badge>;
                    }
                  },
                  {
                    key: "lastModified",
                    header: "Last Modified",
                    render: (date: string) => date ? format(new Date(date), "MMM d, yyyy h:mm a") : "-"
                  },
                  {
                    key: "actions",
                    header: "",
                    width: "50px",
                    render: (_: any, row: any) => {
                      if (row.isUpDir) return null;
                      return (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                                const event = new CustomEvent('rename-file', { detail: { key: row.key, name: row.name } });
                                window.dispatchEvent(event);
                              }}>
                                <Edit2 className="mr-2 h-4 w-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const event = new CustomEvent('move-file', { detail: { key: row.key, name: row.name } });
                                window.dispatchEvent(event);
                              }}>
                                <FolderPlus className="mr-2 h-4 w-4" /> Move
                              </DropdownMenuItem>
                              {!row.isFolder && (
                                <>
                                  <DropdownMenuItem onClick={() => copyToClipboard(row.cdnUrl, "URL")}>
                                    <LinkIcon className="mr-2 h-4 w-4" /> Get URL
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const event = new CustomEvent('download-file', { detail: { key: row.key, name: row.name, cdnUrl: row.cdnUrl } });
                                    window.dispatchEvent(event);
                                  }}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                const event = new CustomEvent('delete-file', { detail: row.key });
                                window.dispatchEvent(event);
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }
                  }
                ]}
                rows={items}
                isLoading={isLoading}
                emptyMessage="This folder is empty."
              />
            </div>
          )}
            
            {/* Sticky Bulk Action Bar for both views */}
            {selectedKeys.size > 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="text-sm font-medium">
                  <span className="text-primary mr-1">{selectedKeys.size}</span> items selected
                </span>
                <div className="h-4 w-px bg-border"></div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedKeys(new Set())}>Cancel</Button>
                <Button size="sm" variant="destructive" onClick={() => setIsBulkDeleteModalOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </Button>
              </div>
            )}

          </div>
        </div>

        {/* Modals */}
        <Dialog open={isNavigateModalOpen} onOpenChange={setIsNavigateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Navigate to folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Path</label>
                <Input
                  placeholder="e.g. assignments/math"
                  value={navigatePath}
                  onChange={(e) => setNavigatePath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNavigateToFolder();
                    }
                  }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Enter a folder path within this bucket.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNavigateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleNavigateToFolder} className="bg-emerald-600 hover:bg-emerald-700 text-white">Navigate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      
      {/* Rename Dialog Removed - Using Inline Editing */}
      <Dialog open={!!fileToRename} onOpenChange={(open) => !open && setFileToRename(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {fileToRename?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">New Name</p>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToRename(null)}>Cancel</Button>
            <Button onClick={handleRenameFile} disabled={renameObjectMutation.isPending || !newFileName.trim() || newFileName === fileToRename?.name}>
              {renameObjectMutation.isPending && <Spinner className="mr-2" />}
              {renameObjectMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move File Modal */}
      <Dialog open={!!fileToMove} onOpenChange={(open) => !open && setFileToMove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move {fileToMove?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Destination Folder Path</p>
              <Input
                value={moveDestinationPrefix}
                onChange={(e) => setMoveDestinationPrefix(e.target.value)}
                placeholder="e.g., folder1/folder2/"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Current path: {fileToMove?.key.substring(0, fileToMove?.key.lastIndexOf('/') + 1) || "Root"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToMove(null)}>Cancel</Button>
            <Button onClick={handleMoveFile} disabled={renameObjectMutation.isPending}>
              {renameObjectMutation.isPending && <Spinner className="mr-2" />}
              {renameObjectMutation.isPending ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DangerConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        warningMessage="This file will be permanently deleted from the servers."
        actionLabel="Delete"
        onConfirm={handleDeleteFile}
        isLoading={deleteObjectMutation.isPending}
      />

      <DangerConfirmDialog
        open={isBulkDeleteModalOpen}
        onOpenChange={setIsBulkDeleteModalOpen}
        title={`Delete ${selectedKeys.size} Files`}
        description={`Are you sure you want to permanently delete these ${selectedKeys.size} items? This action cannot be undone.`}
        warningMessage="These files will be permanently deleted from the servers."
        actionLabel="Bulk Delete"
        onConfirm={handleBulkDelete}
        isLoading={deleteObjectsMutation.isPending}
      />

      {/* Floating Upload Progress Toast */}
      {uploadingFiles.length > 0 && (
        <div className="absolute top-4 right-4 z-50 w-[380px] bg-card border border-border shadow-xl rounded-md overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Spinner className="text-muted-foreground" />
              Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {Math.round(uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingFiles.length)}%
            </div>
          </div>
          
          <div className="h-1 bg-muted w-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300" 
              style={{ width: `${uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingFiles.length}%` }} 
            />
          </div>
          
          <div className="p-3 bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Please do not close the browser</span>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-background">Cancel</Button>
          </div>
        </div>
      )}

    </div>
  );
}
