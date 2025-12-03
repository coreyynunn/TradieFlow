"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import UploadBox from "./UploadBox";

type JobAttachment = {
  id: number;
  type: "photo" | "document";
  file_name: string;
  file_url: string;
  mime_type: string | null;
  created_at: string;
};

export default function JobAttachmentsSection({ jobId }: { jobId: number }) {
  const [photos, setPhotos] = useState<JobAttachment[]>([]);
  const [docs, setDocs] = useState<JobAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_attachments")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const typed = data as JobAttachment[];
        setPhotos(typed.filter((a) => a.type === "photo"));
        setDocs(typed.filter((a) => a.type === "document"));
      }
      setLoading(false);
    };

    fetchAttachments();
  }, [jobId]);

  const uploadFiles = async (files: FileList, type: "photo" | "document") => {
    if (files.length === 0) return;

    type === "photo" ? setUploadingPhotos(true) : setUploadingDocs(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      type === "photo" ? setUploadingPhotos(false) : setUploadingDocs(false);
      return;
    }

    const bucket = "job-uploads";
    const newAttachments: JobAttachment[] = [];

    for (const file of Array.from(files)) {
      const timestamp = Date.now();
      const path = `${user.id}/${jobId}/${type === "photo" ? "photos" : "docs"}/${timestamp}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (uploadError || !uploadData) {
        console.error("Upload error", uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      const fileUrl = publicUrlData.publicUrl;

      const { data: insertData, error: insertError } = await supabase
        .from("job_attachments")
        .insert({
          job_id: jobId,
          user_id: user.id,
          type,
          file_name: file.name,
          file_url: fileUrl,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select("*")
        .single();

      if (!insertError && insertData) {
        newAttachments.push(insertData as JobAttachment);
      }
    }

    if (newAttachments.length > 0) {
      if (type === "photo") {
        setPhotos((prev) => [...newAttachments, ...prev]);
      } else {
        setDocs((prev) => [...newAttachments, ...prev]);
      }
    }

    type === "photo" ? setUploadingPhotos(false) : setUploadingDocs(false);
  };

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Photos & Files</h2>

      {/* Photos */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Photos</span>
          {uploadingPhotos && (
            <span className="text-xs text-gray-500">Uploading...</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <UploadBox
            label="Add photos"
            description="Before / progress / after"
            accept="image/*"
            onFilesSelected={(files) => uploadFiles(files, "photo")}
          />
          {loading ? (
            <div className="text-sm text-gray-400 col-span-1">
              Loading photos...
            </div>
          ) : (
            photos.map((p) => (
              <div
                key={p.id}
                className="border rounded-md overflow-hidden bg-gray-50"
              >
                <a href={p.file_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.file_url}
                    alt={p.file_name}
                    className="w-full h-24 object-cover"
                  />
                </a>
                <div className="p-1">
                  <div className="text-[10px] truncate">{p.file_name}</div>
                  <div className="text-[9px] text-gray-400">
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Documents</span>
          {uploadingDocs && (
            <span className="text-xs text-gray-500">Uploading...</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <UploadBox
            label="Attach documents"
            description="PDFs, receipts, certs"
            accept=".pdf,image/*"
            onFilesSelected={(files) => uploadFiles(files, "document")}
          />
          {loading ? (
            <div className="text-sm text-gray-400">Loading files...</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-gray-400">
              No documents yet. Click the box to add.
            </div>
          ) : (
            docs.map((d) => (
              <a
                key={d.id}
                href={d.file_url}
                target="_blank"
                rel="noreferrer"
                className="border rounded-md p-2 flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <div>
                  <div className="text-xs font-medium truncate">
                    {d.file_name}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500">
                  {d.mime_type?.includes("pdf") ? "PDF" : "File"}
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
