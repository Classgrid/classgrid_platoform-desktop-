import React, { useState } from "react";
import { 
  Folder, FileText, Image as ImageIcon, Video, FileArchive, 
  File, UploadCloud, FolderPlus, MoreHorizontal, Download, 
  Trash2, Edit2, Link as LinkIcon, Search, RefreshCw, Columns, X,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Badge } from "@/components/marketing_ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/marketing_ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/marketing_ui/dialog";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { FileUploadModal } from "../components/FileUploadModal";

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

export function StorageFilesPage() {
  const [prefix, setPrefix] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Active file for the right preview pane
  const [activeFile, setActiveFile] = useState<any | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [fileToRename, setFileToRename] = useState<{ key: string, name: string } | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);

  const { data, isLoading, refetch } = useStorageObjects(prefix, debouncedSearch);
  const createFolderMutation = useCreateFolder();
  const deleteObjectMutation = useDeleteObject();
  const deleteObjectsMutation = useDeleteObjects();
  const renameObjectMutation = useRenameObject();

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleFolderClick = (folderPrefix: string) => {
    setPrefix(folderPrefix);
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedKeys(new Set());
    setActiveFile(null);
  };

  const handleUploadClick = () => setIsFileUploadModalOpen(true);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({ folderName: newFolderName, prefix }, {
      onSuccess: () => {
        setIsFolderModalOpen(false);
        setNewFolderName("");
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
    
    const newKey = prefix + newFileName.trim();
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

  const handleDownload = async (key: string) => {
    try {
      const { downloadUrl } = await storageApi.getPresignedUrl(key);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      toast.error("Failed to generate download link.");
    }
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
    ...(prefix ? [{
      isUpDir: true,
      key: "up_dir",
      name: "..",
      isFolder: true
    }] : []),
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

  const prefixParts = prefix.split("/").filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-background p-4 w-full gap-4 max-w-[1600px] mx-auto">
      
      {/* 1. Breadcrumbs (Outside the box) */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <span>Files</span>
        <ChevronRight size={14} />
        <span>Buckets</span>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium flex items-center gap-2">
          classgrid-storage
          <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 text-[10px] uppercase tracking-wider py-0 rounded">
            Public
          </Badge>
        </span>
        
        {prefixParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={14} />
            <span 
              className={`cursor-pointer hover:text-foreground ${index === prefixParts.length - 1 ? "text-foreground font-medium" : ""}`}
              onClick={() => {
                const newParts = prefixParts.slice(0, index + 1);
                handleFolderClick(newParts.join("/") + "/");
              }}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* 2. Main Container (The bordered box) */}
      <div className="flex flex-col flex-1 border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        
        {/* Top Toolbar (Inside box) */}
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
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 bg-background shadow-sm"
              title="Toggle sidebar"
            >
              <Columns size={16} />
            </Button>
            
            <div className="h-5 w-px bg-border mx-1.5"></div>
            
            <Button 
              variant="outline" 
              className="h-9 bg-background shadow-sm text-sm font-medium" 
              onClick={() => setIsFolderModalOpen(true)}
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
          </div>
        </div>

        {/* 3. Split Pane Area */}
        <div className="flex flex-1 overflow-hidden bg-background">
          
          {/* Left Pane: File List */}
          <div className="w-[320px] shrink-0 border-r border-border flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-sm text-muted-foreground text-center flex flex-col items-center">
                  <Folder className="h-8 w-8 mb-2 opacity-20" />
                  This folder is empty.
                </div>
              ) : (
                items.map((item, idx) => {
                  if (item.isUpDir) {
                    return (
                      <div 
                        key="up"
                        onClick={() => {
                          const parts = prefix.split("/").filter(Boolean);
                          parts.pop();
                          const newPrefix = parts.length > 0 ? parts.join("/") + "/" : "";
                          handleFolderClick(newPrefix);
                        }}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm text-foreground transition-colors"
                      >
                        <div className="w-4 h-4 shrink-0"></div>
                        <Folder size={16} className="text-muted-foreground shrink-0" />
                        <span className="font-medium">..</span>
                      </div>
                    );
                  }

                  const isSelected = selectedKeys.has(item.key);
                  const isActive = activeFile?.key === item.key;

                  return (
                    <div 
                      key={item.key}
                      onClick={() => {
                        if (item.isFolder) {
                          handleFolderClick(item.key);
                        } else {
                          setActiveFile(item);
                        }
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm group transition-colors ${isActive || isSelected ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div onClick={(e) => { e.stopPropagation(); toggleSelection(e, item.key); }} className="shrink-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 group-hover:border-foreground/40'}`}>
                            {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </div>
                        
                        {item.isFolder ? <Folder size={16} className="text-yellow-500 fill-yellow-500/20 shrink-0" /> : getFileIcon(item.type)}
                        <span className="truncate selection:bg-transparent">{item.name}</span>
                      </div>

                      {!item.isFolder && (
                        <div className="opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-background shadow-sm text-muted-foreground">
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 shadow-xl">
                              <DropdownMenuItem onClick={() => copyToClipboard(item.cdnUrl, "CDN Link")}>
                                <LinkIcon className="mr-2 h-4 w-4" /> Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(item.key)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setFileToDelete(item.key)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Bottom Actions if files selected */}
            {selectedKeys.size > 0 && (
              <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{selectedKeys.size} selected</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setSelectedKeys(new Set())}>Clear</Button>
                  <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={() => setIsBulkDeleteModalOpen(true)}>Delete</Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: File Preview */}
          <div className="flex-1 flex flex-col bg-muted/10 relative">
            {activeFile ? (
              <div className="flex flex-col h-full">
                {/* Preview Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {getFileIcon(activeFile.type)}
                    <h3 className="font-medium text-sm truncate">{activeFile.name}</h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 bg-background shadow-sm" onClick={() => copyToClipboard(activeFile.cdnUrl, "CDN URL")}>
                      <LinkIcon className="mr-2 h-3 w-3" /> Copy URL
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 bg-background shadow-sm" onClick={() => handleDownload(activeFile.key)}>
                      <Download className="mr-2 h-3 w-3" /> Download
                    </Button>
                    <div className="w-px h-5 bg-border mx-1"></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => setActiveFile(null)}>
                      <X size={16} />
                    </Button>
                  </div>
                </div>
                
                {/* Preview Content Area */}
                <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center relative">
                  {/* Subtle grid pattern background for preview area */}
                  <div className="absolute inset-0 bg-grid-white/10 dark:bg-grid-black/10 bg-[length:16px_16px] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-10 pointer-events-none" />
                  
                  {activeFile.type.startsWith("image/") ? (
                    <img src={activeFile.cdnUrl} alt={activeFile.name} className="max-w-full max-h-[500px] object-contain rounded-md shadow-lg border border-border/50 bg-background" />
                  ) : activeFile.type.startsWith("video/") ? (
                    <video src={activeFile.cdnUrl} controls className="max-w-full max-h-[500px] rounded-md shadow-lg border border-border/50 bg-background" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 border border-border border-dashed rounded-xl bg-card max-w-md w-full shadow-sm z-10">
                      <File size={48} className="text-muted-foreground mb-4 opacity-50" />
                      <h4 className="text-lg font-medium mb-1 text-center">No Preview Available</h4>
                      <p className="text-sm text-muted-foreground text-center mb-6">
                        Preview is not supported for {activeFile.type || "this file format"}.
                      </p>
                      <Button onClick={() => handleDownload(activeFile.key)} variant="outline" className="bg-background">
                        <Download className="mr-2 h-4 w-4" /> Download File
                      </Button>
                    </div>
                  )}
                </div>

                {/* File Details Sidebar/Footer style */}
                <div className="p-4 bg-card border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Added</div>
                    <div className="font-mono text-xs">{activeFile.lastModified ? format(new Date(activeFile.lastModified), "dd MMM yyyy") : "-"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Type</div>
                    <div className="font-mono text-xs truncate" title={activeFile.type}>{activeFile.type}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Size</div>
                    <div className="font-mono text-xs">{formatBytes(activeFile.size)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">ID</div>
                    <div className="font-mono text-xs truncate" title={activeFile.key}>{activeFile.key.split("/").pop()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="p-6 rounded-full bg-background border border-border shadow-sm mb-4">
                  <File size={32} className="opacity-40" />
                </div>
                <p className="text-sm font-medium">Select a file</p>
                <p className="text-xs opacity-60 mt-1">File preview and details will appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g. images" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending || !newFolderName.trim()}>
              {createFolderMutation.isPending ? "Creating..." : "Create folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <FileUploadModal 
        isOpen={isFileUploadModalOpen} 
        onClose={() => setIsFileUploadModalOpen(false)} 
        prefix={prefix} 
      />

    </div>
  );
}
