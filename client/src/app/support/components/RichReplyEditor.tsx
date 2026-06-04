"use client";

import React, { useRef, useCallback, useImperativeHandle, forwardRef, useState } from "react";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Image as ImageIcon,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import LinkModal from "@/app/support/components/LinkModal";
import { uploadToSupabase } from "@/lib/supabase-storage";

function ToolBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
    >
      {icon}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />;
}

export interface RichReplyEditorRef {
  clear: () => void;
  getHTML: () => string;
}

interface RichReplyEditorProps {
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  onSubmit?: () => void;
}

interface LinkTooltipState {
  url: string;
  x: number;
  y: number;
}

const RichReplyEditor = forwardRef<RichReplyEditorRef, RichReplyEditorProps>(
  ({ onChange, placeholder = "Type your reply here...", minHeight = 120, onSubmit }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [linkTooltip, setLinkTooltip] = useState<LinkTooltipState | null>(null);
    const [isPlainText, setIsPlainText] = useState(false);
    const savedHTML = useRef<string>("");
    const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const syncContent = useCallback(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          onChange("");
        }
      },
      getHTML: () => editorRef.current?.innerHTML || "",
    }), [onChange]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && onSubmit) {
          const text = editorRef.current?.innerText?.trim() || "";
          if (text) {
            e.preventDefault();
            onSubmit();
          }
        }
      },
      [onSubmit]
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent) => {
        const html = e.clipboardData.getData("text/html");
        if (html) {
          e.preventDefault();
          document.execCommand("insertHTML", false, html);
          syncContent();
        }
      },
      [syncContent]
    );

    const handleLinkInsert = useCallback((url: string, text?: string) => {
      editorRef.current?.focus();
      const label = text || url;
      document.execCommand("insertHTML", false,
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>&nbsp;`
      );
      syncContent();
    }, [syncContent]);

    const handleImageUpload = useCallback(() => {
      imageInputRef.current?.click();
    }, []);

    const onImageSelected = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setUploadProgress(10);
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 80) { clearInterval(interval); return 80; }
            return prev + 10;
          });
        }, 200);

        const result = await uploadToSupabase(file, "replies");
        clearInterval(interval);

        if (result) {
          setUploadProgress(100);
          setTimeout(() => {
            setUploadingImage(false);
            editorRef.current?.focus();
            document.execCommand("insertHTML", false,
              `<img src="${result.url}" alt="${file.name}" data-path="${result.path}" style="max-width:200px;max-height:200px;border-radius:8px;margin:8px 4px;cursor:pointer;border:1px solid #333;" />`
            );
            syncContent();
          }, 300);
        } else {
          setUploadingImage(false);
          alert("Image upload failed. Please try again.");
        }
        e.target.value = "";
      },
      [syncContent]
    );

    const handleMouseOver = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && editorRef.current?.contains(anchor)) {
        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
        const rect = anchor.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        setLinkTooltip({
          url: anchor.getAttribute("href") || "",
          x: rect.left - editorRect.left,
          y: rect.bottom - editorRect.top + 4,
        });
      }
    }, []);

    const handleMouseOut = useCallback((e: React.MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.(".link-tooltip-popup")) return;
      tooltipTimeout.current = setTimeout(() => setLinkTooltip(null), 300);
    }, []);

    const handleEditorClick = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        setPreviewImage((target as HTMLImageElement).src);
      }
    }, []);

    const deleteClickedImage = useCallback(() => {
      if (!previewImage || !editorRef.current) return;
      const imgs = editorRef.current.querySelectorAll("img");
      imgs.forEach((img) => {
        if (img.src === previewImage) img.remove();
      });
      setPreviewImage(null);
      syncContent();
    }, [previewImage, syncContent]);

    const removeLink = useCallback(() => {
      if (!linkTooltip || !editorRef.current) return;
      const links = editorRef.current.querySelectorAll("a");
      links.forEach((a) => {
        if (a.getAttribute("href") === linkTooltip.url) {
          const text = document.createTextNode(a.textContent || "");
          a.parentNode?.replaceChild(text, a);
        }
      });
      setLinkTooltip(null);
      syncContent();
    }, [linkTooltip, syncContent]);

    return (
      <>
        <div className="rounded-xl border border-zinc-300 dark:border-[#2a2a2a] bg-zinc-50 dark:bg-[#0f0f0f] focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition-all overflow-hidden">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={onImageSelected}
            className="hidden"
          />

          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#141414] overflow-x-auto">
            <select
              className="text-xs font-medium bg-transparent text-zinc-500 dark:text-zinc-400 border-none focus:ring-0 pr-6 cursor-pointer"
              onChange={(e) => {
                editorRef.current?.focus();
                document.execCommand("formatBlock", false, e.target.value);
                e.target.value = "";
                syncContent();
              }}
              defaultValue=""
            >
              <option value="" disabled>Heading</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="p">Paragraph</option>
            </select>
            <Sep />
            <ToolBtn icon={<Bold className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("bold"); syncContent(); }} title="Bold" />
            <ToolBtn icon={<Italic className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("italic"); syncContent(); }} title="Italic" />
            <Sep />
            <ToolBtn icon={<ImageIcon className="w-3.5 h-3.5" />} onClick={handleImageUpload} title="Insert image" />
            <ToolBtn icon={<Link2 className="w-3.5 h-3.5" />} onClick={() => setLinkModalOpen(true)} title="Insert link" />
            <Sep />
            <ToolBtn icon={<ListOrdered className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("insertOrderedList"); syncContent(); }} title="Numbered list" />
            <ToolBtn icon={<List className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("insertUnorderedList"); syncContent(); }} title="Bullet list" />
            <ToolBtn icon={<Quote className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("formatBlock", false, "blockquote"); syncContent(); }} title="Quote" />
            <Sep />
            <ToolBtn icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("undo"); syncContent(); }} title="Undo" />
            <ToolBtn icon={<Redo2 className="w-3.5 h-3.5" />} onClick={() => { document.execCommand("redo"); syncContent(); }} title="Redo" />
            <div className="ml-auto flex items-center gap-3">
              {uploadingImage && (
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-bold text-emerald-500">Uploading {uploadProgress}%</div>
                  <div className="w-16 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!editorRef.current) return;
                  if (isPlainText) {
                    editorRef.current.innerHTML = savedHTML.current;
                    setIsPlainText(false);
                  } else {
                    savedHTML.current = editorRef.current.innerHTML;
                    editorRef.current.innerText = editorRef.current.innerText;
                    setIsPlainText(true);
                  }
                  syncContent();
                }}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${isPlainText ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"}`}
              >
                {isPlainText ? "Rich text" : "Plain text"}
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              data-placeholder={placeholder}
              onInput={syncContent}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onClick={handleEditorClick}
              onMouseOver={handleMouseOver}
              onMouseOut={handleMouseOut}
              className="p-4 bg-transparent text-sm text-zinc-950 dark:text-white outline-none prose prose-sm dark:prose-invert max-w-none [&_p]:mb-3 [&_p]:leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-600 empty:before:pointer-events-none [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 dark:[&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-emerald-500 [&_a]:underline [&_a]:cursor-pointer [&_img]:max-w-[150px] [&_img]:max-h-[150px] [&_img]:object-cover [&_img]:rounded-lg [&_img]:cursor-pointer [&_img]:border [&_img]:border-zinc-700 [&_img]:shadow-sm [&_img]:inline-block [&_img]:m-2 hover:[&_img]:opacity-80"
              style={{ minHeight, maxHeight: 300, overflowY: "auto" }}
            />

            {linkTooltip && (
              <div
                className="link-tooltip-popup absolute z-20 flex items-center gap-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl text-xs text-white animate-in fade-in duration-150"
                style={{ left: linkTooltip.x, top: linkTooltip.y }}
                onMouseEnter={() => {
                  if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
                }}
                onMouseLeave={() => setLinkTooltip(null)}
              >
                <span className="max-w-[200px] truncate text-zinc-300">{linkTooltip.url}</span>
                <a
                  href={linkTooltip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
                <button
                  onClick={removeLink}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600/80 text-white rounded font-semibold hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <LinkModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onInsert={handleLinkInsert}
        />

        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={() => setPreviewImage(null)}
          >
            <div className="absolute top-5 right-5 flex items-center gap-3 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); deleteClickedImage(); }}
                title="Delete image"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                title="Close"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }
);

RichReplyEditor.displayName = "RichReplyEditor";
export default RichReplyEditor;
