"use client";

import { useRef } from "react";

type UploadBoxProps = {
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: FileList) => void;
};

export default function UploadBox({
  label,
  description,
  accept,
  multiple = true,
  onFilesSelected,
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div
      onClick={handleClick}
      className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition"
      style={{ minHeight: 120 }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
      <div className="text-sm font-medium mb-1">{label}</div>
      {description && (
        <div className="text-xs text-gray-500 text-center">{description}</div>
      )}
      <div className="text-xs text-gray-400 mt-2">Click to upload</div>
    </div>
  );
}
