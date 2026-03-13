import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, File, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

const DOC_TYPES = [
  { value: 'FORM_1',                          label: 'Form I' },
  { value: 'FORM_1A',                         label: 'Form IA' },
  { value: 'ENVIRONMENTAL_IMPACT_ASSESSMENT', label: 'EIA Report' },
  { value: 'PRE_FEASIBILITY_REPORT',          label: 'Pre-Feasibility Report' },
  { value: 'MAP_TOPOSHEET',                   label: 'Topo Sheet / Map' },
  { value: 'FOREST_CLEARANCE',                label: 'Forest Clearance' },
  { value: 'WATER_CONSENT',                   label: 'Water Consent (NOC)' },
  { value: 'NOC',                             label: 'NOC / Other Consent' },
  { value: 'OTHER',                           label: 'Other Document' },
];

interface UploadedDoc {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  verified: boolean;
  fileSizeBytes: number;
}

interface DocumentUploadProps {
  applicationId: string;
  existingDocs?: UploadedDoc[];
  /** If false, only shows the existing docs without an upload form */
  canUpload?: boolean;
  /** Called after a successful upload or delete so parents can refetch */
  onchange?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload({
  applicationId,
  existingDocs = [],
  canUpload = true,
  onchange,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('OTHER');
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', selectedType);
      return api.post(`/documents/${applicationId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      void queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      onchange?.();
    },
    onError: () => toast.error('Upload failed — check file type and size (max 20MB)'),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/documents/${docId}`),
    onSuccess: () => {
      toast.success('Document removed');
      void queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      onchange?.();
    },
    onError: () => toast.error('Failed to remove document'),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, JPG, PNG, and Word documents are allowed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large — maximum 20 MB');
      return;
    }
    uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {canUpload && (
        <div className="space-y-3">
          {/* Document type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {DOC_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-primary bg-green-50 scale-[1.01]'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-gray-500">Uploading…</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX — max 20 MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        </div>
      )}

      {/* Uploaded documents list */}
      {existingDocs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Uploaded Documents ({existingDocs.length})
          </h3>
          {existingDocs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <File className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {DOC_TYPES.find(dt => dt.value === doc.docType)?.label || doc.docType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-400">{formatBytes(doc.fileSizeBytes)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {doc.verified ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Pending
                  </span>
                )}
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline px-1"
                >
                  View
                </a>
                {canUpload && (
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Remove document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {existingDocs.length === 0 && !canUpload && (
        <p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet</p>
      )}
    </div>
  );
}
