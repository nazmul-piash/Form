import React, { useState } from 'react';
import axios from 'axios';
import { Upload, X, FileText, Loader } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: { name: string; fileUrl: string }) => void;
  onRemove?: () => void;
  value?: { name: string; fileUrl: string };
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, onRemove, value, label = "Upload Document" }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      onUpload(res.data);
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center overflow-hidden">
          <FileText className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" />
          <a href={value.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 truncate hover:text-indigo-600 underline">
            {value.name}
          </a>
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 ml-2">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors relative">
        <div className="space-y-1 text-center">
          {uploading ? (
            <Loader className="mx-auto h-12 w-12 text-indigo-400 animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <div className="flex text-sm text-gray-600 justify-center">
            <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>{uploading ? 'Uploading...' : 'Upload a file'}</span>
              <input type="file" className="sr-only" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
        </div>
        {error && <p className="absolute bottom-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default FileUpload;
