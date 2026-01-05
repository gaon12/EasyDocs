"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getFileType } from "@/app/lib/file-type";
import { registerLocalFile } from "@/app/lib/local-files";
import { addPendingFiles, type PendingFileEntry } from "@/app/lib/pending-files";
import { encodePdfSrcForPath, resolvePdfSrc } from "@/app/lib/pdf";

const isTaggedShortcut = (value: string) =>
  value.startsWith("arxiv:") || value.startsWith("hitomi:");

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    target.isContentEditable
  );
};

const hasFileTransfer = (event: DragEvent) => {
  const types = event.dataTransfer?.types;
  return types ? Array.from(types).includes("Files") : false;
};

const buildPendingEntries = (files: File[]): PendingFileEntry[] =>
  files.map((file) => ({
    key: registerLocalFile(file),
    name: file.name,
    size: file.size,
    type: getFileType(file.name),
  }));

const resolveViewerTarget = (value: string) => {
  if (!value) return "";
  if (isTaggedShortcut(value)) {
    return `/viewer/${encodeURIComponent(value)}`;
  }
  const resolved = resolvePdfSrc(value, { allowBlob: true });
  if (!resolved) return "";
  return `/viewer/${encodePdfSrcForPath(resolved)}`;
};

export function GlobalDropzone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const handleFiles = (files: File[]) => {
    const supported = files.filter(
      (file) => getFileType(file.name) !== "unknown",
    );
    if (!supported.length) return;
    const entries = buildPendingEntries(supported);
    if (entries.length === 1) {
      const entry = entries[0];
      const params = new URLSearchParams();
      params.set("name", entry.name);
      const query = params.toString();
      router.push(
        `/viewer/local/${encodeURIComponent(entry.key)}${query ? `?${query}` : ""}`,
      );
      return;
    }
    addPendingFiles(entries);
    router.push("/open");
  };

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      if (event.defaultPrevented) return;
      if (!hasFileTransfer(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (event.defaultPrevented) return;
      if (!hasFileTransfer(event)) return;
      event.preventDefault();
    };

    const handleDragLeave = (event: DragEvent) => {
      if (event.defaultPrevented) return;
      if (!hasFileTransfer(event) && dragDepth.current === 0) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragEnd = () => {
      dragDepth.current = 0;
      setIsDragging(false);
    };

    const handleDrop = (event: DragEvent) => {
      if (event.defaultPrevented) return;
      if (!hasFileTransfer(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length) {
        handleFiles(files);
      }
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) {
        event.preventDefault();
        handleFiles(files);
        return;
      }

      if (isEditableTarget(event.target)) return;
      const text = event.clipboardData?.getData("text") ?? "";
      const candidate =
        text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .find((line) => line.length > 0) ?? "";
      if (!candidate) return;
      const target = resolveViewerTarget(candidate);
      if (!target) return;
      event.preventDefault();
      router.push(target);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("paste", handlePaste);
    };
  }, [router]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-600/15 backdrop-blur-sm">
      <div className="rounded-3xl border-2 border-dashed border-emerald-500/60 bg-white/90 px-8 py-10 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Drop to open
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Release files anywhere to view them instantly.
        </p>
      </div>
    </div>
  );
}
