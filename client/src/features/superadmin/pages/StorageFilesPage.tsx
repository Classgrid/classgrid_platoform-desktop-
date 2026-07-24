import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Folder, FileText, Image as ImageIcon, Video, FileArchive, 
  File, UploadCloud, FolderPlus, MoreHorizontal, Download, 
  Trash2, Edit2, Link as LinkIcon, ChevronRight, Search, RefreshCw, Columns
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { DataTable } from "@/components/marketing_ui/data-table";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/marketing_ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/marketing_ui/dialog";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList, BreadcrumbPage } from "@/components/marketing_ui/breadcrumb";
import { Badge } from "@/components/marketing_ui/badge";
import { FileUploadModal } from "../components/FileUploadModal";
import FilePreviewModal from "@/app/support/components/FilePreviewModal";

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
  if (contentType.startsWith("image/")) return <ImageIcon size={18} className="text-blue-500" />;
  if (contentType.startsWith("video/")) return <Video size={18} className="text-purple-500" />;
  if (contentType.includes("pdf") || contentType.includes("document") || contentType.startsWith("text/")) return <FileText size={18} className="text-orange-500" />;
  if (contentType.includes("zip") || contentType.includes("tar") || contentType.includes("compressed")) return <FileArchive size={18} className="text-amber-500" />;
  return <File size={18} className="text-muted-foreground" />;
}

export function StorageFilesPage() {
  const [prefix, setPrefix] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [fileToRename, setFileToRename] = useState<{ key: string, name: string } | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<{ name: string, src: string, mimeType: string, key: string } | null>(null);

  // Queries & Mutations
  const { data, isLoading, refetch } = useStorageObjects(prefix, debouncedSearch);
  const uploadFileMutation = useUploadFile();
  const createFolderMutation = useCreateFolder();
  const deleteObjectMutation = useDeleteObject();
  const deleteObjectsMutation = useDeleteObjects();
  const renameObjectMutation = useRenameObject();

  // Search Debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Handlers
  const handleFolderClick = (folderPrefix: string) => {
    setPrefix(folderPrefix);
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedKeys(new Set());
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setPrefix("");
    } else {
      const parts = prefix.split("/").filter(Boolean);
      const newPrefix = parts.slice(0, index + 1).join("/") + "/";
      setPrefix(newPrefix);
    }
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedKeys(new Set());
  };

  const handleUploadClick = () => {
    setIsFileUploadModalOpen(true);
  };

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
      }
    });
  };

  const handleDeleteFile = () => {
    if (!fileToDelete) return;
    deleteObjectMutation.mutate(fileToDelete, {
      onSuccess: () => {
        setFileToDelete(null);
        // Remove from selection if present
        const newSet = new Set(selectedKeys);
        newSet.delete(fileToDelete);
        setSelectedKeys(newSet);
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

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const toggleSelection = (key: string) => {
    const newSet = new Set(selectedKeys);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedKeys(newSet);
  };

  const toggleSelectAll = () => {
    if (!data?.files) return;
    if (selectedKeys.size === data.files.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(data.files.map(f => f.key)));
    }
  };

  // Build rows for DataTable
  const rows = [
    ...(data?.folders || []).map(folder => ({
      _id: folder.prefix,
      isFolder: true,
      key: folder.prefix,
      name: folder.name,
      size: null,
      type: "Folder",
      lastModified: null,
    })),
    ...(data?.files || []).map(file => ({
      _id: file.key,
      isFolder: false,
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.contentType,
      lastModified: file.lastModified,
      cdnUrl: file.cdnUrl
    }))
  ];

  const columns = [
    {
      key: "select",
      header: "",
      width: "w-10",
      render: (_: any, row: any) => {
        if (row.isFolder) return null;
        return (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-border bg-background"
              checked={selectedKeys.has(row.key)}
              onChange={() => toggleSelection(row.key)}
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
          className={`flex items-center gap-3 ${row.isFolder ? "cursor-pointer hover:underline text-primary" : ""}`}
          onClick={() => row.isFolder ? handleFolderClick(row.key) : null}
        >
          {row.isFolder ? <Folder size={18} className="text-yellow-500 fill-yellow-500/20" /> : getFileIcon(row.type)}
          <span className="truncate max-w-[200px] sm:max-w-[300px]">{row.name}</span>
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
      render: (type: string) => {
        if (type === "Folder") return <Badge variant="neutral">Dir</Badge>;
        
        const fileExt = type.split("/").pop()?.toUpperCase() || "FILE";
        
        if (type.startsWith("image/")) return <Badge variant="info">{fileExt}</Badge>;
        if (type.startsWith("video/")) return <Badge variant="secondary">{fileExt}</Badge>;
        if (type.includes("pdf") || type.includes("document") || type.startsWith("text/")) return <Badge variant="warning">{fileExt}</Badge>;
        if (type.includes("zip") || type.includes("tar") || type.includes("compressed")) return <Badge variant="danger">{fileExt}</Badge>;
        
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
        if (row.isFolder) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => copyToClipboard(row.cdnUrl)}>
                  <LinkIcon className="mr-2 h-4 w-4" /> Copy CDN Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(row.key)}>
                  <Download className="mr-2 h-4 w-4" /> Download Temp URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setFileToRename({ key: row.key, name: row.name });
                  setNewFileName(row.name);
                }}>
                  <Edit2 className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setFileToDelete(row.key)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  const prefixParts = prefix.split("/").filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-background w-full">
      {/* Supabase-style sleek toolbar */}
      <div className="flex items-center justify-between border-b border-border p-3 bg-background">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={`Search in ${prefix ? prefix : 'root directory'}...`} 
            className="pl-9 h-9 bg-card border-border rounded-md text-sm" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 bg-transparent border-border" 
            disabled={selectedKeys.size !== 1} 
            onClick={handleRenameSelection}
          >
            <Edit2 size={15} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 bg-transparent border-border" 
            onClick={() => refetch()}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 bg-transparent border-border"
          >
            <Columns size={15} />
          </Button>
          
          <div className="h-5 w-px bg-border mx-1"></div>
          
          <Button 
            variant="outline" 
            className="h-9 bg-transparent border-border text-sm font-medium" 
            onClick={() => setIsFolderModalOpen(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" /> Create folder
          </Button>
          <Button 
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-none text-sm font-medium" 
            onClick={handleUploadClick}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> 
            Upload files
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border text-sm">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                className="cursor-pointer font-medium"
                onClick={() => handleBreadcrumbClick(-1)}
              >
                classgrid-storage
              </BreadcrumbLink>
            </BreadcrumbItem>
            {prefixParts.map((part, index) => (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === prefixParts.length - 1 ? (
                    <BreadcrumbPage>{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      className="cursor-pointer"
                      onClick={() => handleBreadcrumbClick(index)}
                    >
                      {part}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 overflow-auto relative">
        <DataTable 
          columns={columns} 
          rows={rows} 
          isLoading={isLoading} 
          emptyMessage="This folder is empty."
          onRowClick={(row) => {
            if (row.isFolder) {
              handleFolderClick(row.key);
            } else {
              setFileToPreview({ name: row.name, src: row.cdnUrl, mimeType: row.type, key: row.key });
            }
          }}
        />
        
        {/* Sticky Bulk Action Bar */}
        {selectedKeys.size > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
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

      {/* Modals */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Folders in S3 are created as 0-byte object markers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g. 2026-reports" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending || !newFolderName.trim()}>
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fileToRename} onOpenChange={(open) => !open && setFileToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for the file. This creates a copy and deletes the original.
            </DialogDescription>
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
            <Button 
              onClick={handleRenameFile} 
              disabled={renameObjectMutation.isPending || !newFileName.trim() || newFileName === fileToRename?.name}
            >
              {renameObjectMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DangerConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="Delete File"
        description={`Are you sure you want to delete ${fileToDelete?.split("/").pop()}? This action cannot be undone.`}
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

      {fileToPreview && (
        <FilePreviewModal 
          file={fileToPreview} 
          onClose={() => setFileToPreview(null)} 
          onDelete={() => {
            setFileToDelete(fileToPreview.key);
            setFileToPreview(null);
          }}
        />
      )}

    </div>
  );
}
