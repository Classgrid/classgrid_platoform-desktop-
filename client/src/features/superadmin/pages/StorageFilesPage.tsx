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

import {
  useStorageObjects,
  useUploadFile,
  useCreateFolder,
  useDeleteObject,
  useDeleteObjects,
  useRenameObject
} from "../queries/useStorage";
import { storageApi } from "../services/storageApi";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return <ImageIcon size={16} className="text-muted-foreground" />;
  if (contentType.startsWith("video/")) return <Video size={16} className="text-muted-foreground" />;
  if (contentType.includes("pdf") || contentType.includes("document") || contentType.startsWith("text/")) return <FileText size={16} className="text-muted-foreground" />;
  if (contentType.includes("zip") || contentType.includes("tar") || contentType.includes("compressed")) return <FileArchive size={16} className="text-muted-foreground" />;
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

const FilePreviewPane = ({ activeFile, onClose, onDelete }: { activeFile: any, onClose: () => void, onDelete: () => void }) => {
  if (!activeFile) return null;
  return (
    <div className="w-[320px] sm:w-[350px] shrink-0 border-r border-border bg-card flex flex-col h-full animate-in slide-in-from-right-2">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-sm">File Preview</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Preview Box */}
        <div className="w-full aspect-square bg-muted/30 rounded-lg border border-border flex items-center justify-center overflow-hidden">
          {activeFile.type.startsWith("image/") ? (
            <img src={activeFile.cdnUrl} alt={activeFile.name} className="max-w-full max-h-full object-contain" />
          ) : activeFile.type.startsWith("video/") ? (
            <video src={activeFile.cdnUrl} controls className="max-w-full max-h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <File className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-xs">No preview available</span>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-base break-all">{activeFile.name}</h3>
            <p className="text-sm text-muted-foreground">{activeFile.type || "Unknown"} - {formatBytes(activeFile.size || 0)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Added on</p>
            <p className="text-sm">{activeFile.createdAt ? new Date(activeFile.createdAt).toLocaleString() : "-"}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last modified</p>
            <p className="text-sm">{activeFile.lastModified ? new Date(activeFile.lastModified).toLocaleString() : "-"}</p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="text-xs h-9 px-4" onClick={() => window.open(activeFile.cdnUrl, '_blank')}>
              <Download className="mr-2 h-3.5 w-3.5" /> Download
            </Button>
            <Button variant="outline" className="text-xs h-9 px-4" onClick={() => navigator.clipboard.writeText(activeFile.cdnUrl)}>
              <LinkIcon className="mr-2 h-3.5 w-3.5" /> Get URL
            </Button>
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
  isCreatingFolder,
  setIsCreatingFolder,
  handleCreateFolder,
  uploadingFiles,
}: any) => {
  const { data: items = [], isLoading } = useStorageObjects(prefix);
  
  return (
    <div className="w-[280px] sm:w-[320px] shrink-0 border-r border-border flex flex-col bg-background/50 h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {isLastColumn && isCreatingFolder && (
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
                  handleCreateFolder(e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== "Untitled folder") {
                  handleCreateFolder(e.target.value);
                } else {
                  setIsCreatingFolder(false);
                }
              }}
            />
          </div>
        )}

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
        ) : items.length === 0 && (!isLastColumn || !isCreatingFolder) && uploadingFiles.filter((u: any) => u.prefix === prefix).length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Folder className="h-10 w-10 opacity-20" />
            <span className="text-sm">This folder is empty.</span>
          </div>
        ) : (
          <>
            {/* INLINE UPLOADING FILES */}
            {uploadingFiles.filter((u: any) => u.prefix === prefix).map((u: any) => (
              <div 
                key={u.id}
                className="flex items-center justify-between p-2 px-3 rounded-md text-sm opacity-70"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0 w-4 h-4" /> {/* Empty checkbox space */}
                  {getFileIcon(u.file.type)}
                  <span className="truncate">{u.name}</span>
                </div>
                <div className="shrink-0 animate-spin">
                  <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            ))}
            
            {/* EXISTING FILES */}
            {items.map((item: any) => {
              if (item.isUpDir) return null;
            
            const isSelected = selectedKeys.has(item.key);
            const isActive = selectedChildKey === item.key; // Is this the folder/file that is currently clicked and opened to the right?

            return (
              <div 
                key={item.key}
                onClick={() => item.isFolder ? onSelectFolder(item.key) : onSelectFile(item)}
                className={`flex items-center justify-between p-2 px-3 rounded-md cursor-pointer text-sm group ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.key); }} className="shrink-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 group-hover:border-foreground/40'}`}>
                      {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </div>
                  
                  {item.isFolder ? <Folder size={16} className="text-yellow-500 fill-yellow-500/20 shrink-0" /> : getFileIcon(item.type)}
                  <span className="truncate selection:bg-transparent">{item.name}</span>
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

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [fileToRename, setFileToRename] = useState<{ key: string, name: string } | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Custom upload state
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Miller Columns state
  const [openFolders, setOpenFolders] = useState<string[]>([""]); // "" is root
  
  // The effective prefix is the last opened folder
  const currentPrefix = openFolders[openFolders.length - 1];

  const { data, isLoading, refetch } = useStorageObjects(currentPrefix, debouncedSearch);
  const createFolderMutation = useCreateFolder();
  const deleteObjectMutation = useDeleteObject();
  const deleteObjectsMutation = useDeleteObjects();
  const renameObjectMutation = useRenameObject();
  const uploadFileMutation = useUploadFile();

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      prefix: currentPrefix,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);
    
    newUploads.forEach(upload => {
      uploadFileMutation.mutate({
        file: upload.file,
        prefix: upload.prefix,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, progress: percentCompleted } : u));
          }
        }
      }, {
        onSuccess: () => {
          setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 100, status: 'completed' } : u));
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          }, 2000);
          refetch();
        },
        onError: () => {
          setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u));
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          }, 4000);
        }
      });
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = (folderName: string) => {
    if (!folderName.trim()) {
      setIsCreatingFolder(false);
      return;
    }
    const newKey = currentPrefix + folderName.trim() + "/";
    createFolderMutation.mutate(newKey, {
      onSuccess: () => {
        setIsCreatingFolder(false);
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
    if (!fileToRename || !newFileName.trim()) return;
    if (fileToRename.name === newFileName.trim()) {
      setFileToRename(null);
      return;
    }

    const newKey = currentPrefix + newFileName.trim();
    renameObjectMutation.mutate({ sourceKey: fileToRename.key, destinationKey: newKey }, {
      onSuccess: () => {
        setFileToRename(null);
        setNewFileName("");
        if (activeFile?.key === fileToRename.key) setActiveFile(null);
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
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-background shadow-sm"
              onClick={() => refetch()}
              title="Refresh"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </Button>
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
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4" /> Create folder
            </Button>
            <Button
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 text-sm font-medium ml-0.5"
              onClick={handleUploadClick}
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
                  isCreatingFolder={isCreatingFolder}
                  setIsCreatingFolder={setIsCreatingFolder}
                  handleCreateFolder={handleCreateFolder}
                  uploadingFiles={uploadingFiles}
                />
              ))}

              {/* RIGHT SIDE PREVIEW PANE OR EMPTY SPACE */}
              <div className="flex-1 bg-background flex">
                <FilePreviewPane activeFile={activeFile} onClose={() => setActiveFile(null)} onDelete={() => setFileToDelete(activeFile.key)} />
              </div>
            </>
          ) : (
            <div className="flex-1 w-full overflow-hidden flex flex-col p-4 bg-card">
              <DataTable
                columns={[
                  {
                    key: "select",
                    header: "",
                    width: "w-10",
                    render: (_: any, row: any) => {
                      if (row.isFolder || row.isUpDir) return null;
                      return (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border bg-background"
                            checked={selectedKeys.has(row.key)}
                            onChange={(e) => toggleSelection(e as any, row.key)}
                          />
                        </div>
                      );
                    }
                  },
                  {
                    key: "name",
                    header: "Name",
                    accent: true,
                    render: (_: any, row: any) => (
                      <div
                        className={`flex items-center gap-3 ${row.isFolder || row.isUpDir ? "cursor-pointer hover:underline font-medium" : ""}`}
                        onClick={() => {
                          if (row.isUpDir) {
                            const parts = currentPrefix.split("/").filter(Boolean);
                            parts.pop();
                            const newKey = parts.length > 0 ? parts.join("/") + "/" : "";
                            setOpenFolders([newKey]);
                          } else if (row.isFolder) {
                            setOpenFolders([row.key]);
                          }
                        }}
                      >
                        {row.isFolder || row.isUpDir ? <Folder size={18} className="text-yellow-500 fill-yellow-500/20" /> : getFileIcon(row.type)}
                        <span className="truncate max-w-[200px] sm:max-w-[400px]">{row.name}</span>
                      </div>
                    )
                  },
                  {
                    key: "size",
                    header: "Size",
                    render: (size: number | null) => size !== null ? formatBytes(size) : "-"
                  },
                  {
                    key: "type",
                    header: "Type",
                    render: (type: string, row: any) => {
                      if (row.isUpDir) return null;
                      if (type === "Folder") return <Badge variant="neutral">Dir</Badge>;
                      const fileExt = type.split("/").pop()?.toUpperCase() || "FILE";
                      if (type.startsWith("image/")) return <Badge variant="info">{fileExt}</Badge>;
                      if (type.startsWith("video/")) return <Badge variant="secondary">{fileExt}</Badge>;
                      return <Badge variant="outline">{fileExt}</Badge>;
                    }
                  },
                  {
                    key: "lastModified",
                    header: "Last Modified",
                    render: (date: string | null) => date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "-"
                  },
                  {
                    key: "actions",
                    header: "",
                    width: "w-10",
                    render: (_: any, row: any) => {
                      if (row.isFolder || row.isUpDir) return null;
                      return (
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => copyToClipboard(row.cdnUrl, "CDN Link")}>
                                <LinkIcon className="mr-2 h-4 w-4" /> Copy CDN Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {}}>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setFileToDelete(row.key)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    }
                  }
                ]}
                rows={items}
                isLoading={isLoading}
                emptyMessage="This folder is empty."
              />

              {/* Sticky Bulk Action Bar for List View */}
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
          )}

        </div>
      </div>

      {/* Modals */}
      <Dialog open={!!fileToRename} onOpenChange={(open) => !open && setFileToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToRename(null)}>Cancel</Button>
            <Button onClick={handleRenameFile} disabled={renameObjectMutation.isPending || !newFileName.trim() || newFileName === fileToRename?.name}>
              {renameObjectMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DangerConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="delete"
        onConfirm={handleDeleteFile}
        isLoading={deleteObjectMutation.isPending}
      />

      <DangerConfirmDialog
        open={isBulkDeleteModalOpen}
        onOpenChange={setIsBulkDeleteModalOpen}
        title={`Delete ${selectedKeys.size} Files`}
        description={`Are you sure you want to permanently delete these ${selectedKeys.size} items? This action cannot be undone.`}
        confirmText="bulk delete"
        onConfirm={handleBulkDelete}
        isLoading={deleteObjectsMutation.isPending}
      />

      {/* Floating Upload Progress Toast */}
      {uploadingFiles.length > 0 && (
        <div className="absolute top-4 right-4 z-50 w-[380px] bg-card border border-border shadow-xl rounded-md overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="animate-spin text-muted-foreground">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
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
