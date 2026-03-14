import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Search, FileText, Bot, ShieldCheck, AlertTriangle, FileBox, ExternalLink } from 'lucide-react';
import api from '../lib/api';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Document Upload', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'scan', label: 'ClamAV Security Scan', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'ocr', label: 'Tesseract OCR', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'classify', label: 'Groq Classification', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'complete', label: 'Completeness Check', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
];

interface DocumentVerificationResult {
  classification: string;
  status: 'Complete' | 'Incomplete' | 'Review';
  findings: string[];
  pages: number | null;
  confidence: number;
}

interface DocumentData {
  id: string;
  applicationId: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  ocrText: string | null;
  verificationResult: DocumentVerificationResult | null;
}

export default function DocumentVerificationPipeline({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<DocumentData[]>({
    queryKey: ['documents', applicationId],
    queryFn: () => api.get(`/documents/${applicationId}`).then((r: any) => r.data.data),
    enabled: !!applicationId,
    refetchInterval: (data: unknown) => {
        // Poll every 3 seconds if any document is still processing
        const docs = (data as { queryKey: [string, string, DocumentData[]] })?.queryKey?.[2] || [];
        const isProcessing = docs.some?.((d: DocumentData) => !d.verificationResult);
        return isProcessing ? 3000 : false;
    }
  });

  // Fallback purely time-based polling if data isn't loaded yet
  useEffect(() => {
     let interval: NodeJS.Timeout;
     if (documents.some(d => !d.verificationResult)) {
         interval = setInterval(() => {
             queryClient.invalidateQueries({ queryKey: ['documents', applicationId] });
         }, 3000);
     }
     return () => clearInterval(interval);
  }, [documents, applicationId, queryClient]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Complete':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Complete</span>;
      case 'Incomplete':
        return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Incomplete</span>;
      case 'Review':
      default:
        return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Review</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* HEADER & PIPELINE VISUALIZATION */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
             <Bot className="w-5 h-5 text-primary" /> Active Intelligent Document Verification
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Every uploaded file passes through an automated AI pipeline: textual extraction, document classification, & NLP completeness check.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 relative hidden md:block">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -z-10 -translate-y-1/2" />
          <div className="flex items-center justify-between gap-2 relative z-10 w-full px-2">
            {PIPELINE_STEPS.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-2 bg-white"
              >
                <div className={`w-12 h-12 rounded-full ${step.bg} border-2 border-white shadow-sm flex items-center justify-center`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center uppercase tracking-wider w-20 leading-tight">
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* DOCUMENT RESULTS LIST */}
      <div className="p-5 space-y-3">
         <h3 className="text-sm font-bold text-gray-900 mb-4 px-1">Processed Documents ({documents.length})</h3>
         
         {isLoading ? (
             <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                Loading documents...
             </div>
         ) : documents.length === 0 ? (
             <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                 <FileBox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                 <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
             </div>
         ) : (
             <div className="space-y-4">
                 {documents.map((doc) => {
                     const isProcessing = !doc.verificationResult;
                     const vr = doc.verificationResult;

                     return (
                         <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                             
                             {/* Loading overlay for processing documents */}
                             {isProcessing && (
                                 <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center border border-blue-200">
                                     <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm text-blue-700 font-semibold text-sm">
                                         <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                         AI Pipeline is parsing document...
                                     </div>
                                 </div>
                             )}

                             <div className={`flex flex-col md:flex-row md:items-start justify-between gap-4 ${isProcessing ? 'opacity-30' : ''}`}>
                                 {/* File Details */}
                                 <div className="flex items-start gap-3 flex-1">
                                     <div className="bg-gray-100 p-2.5 rounded-lg shrink-0">
                                         <FileText className="w-6 h-6 text-gray-600" />
                                     </div>
                                     <div>
                                         <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 text-base hover:text-primary flex items-center gap-1.5">
                                            {doc.fileName}
                                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                         </a>
                                         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
                                             <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">Claimed: {doc.docType.replace(/_/g, ' ')}</span>
                                             {vr && (
                                                <>
                                                    <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                                        AI Class: {vr.classification}
                                                    </span>
                                                    <span>{vr.pages ? `${vr.pages} Pages` : 'Unknown length'}</span>
                                                    <span>{doc.ocrText?.length || 0} characters extracted</span>
                                                </>
                                             )}
                                         </div>
                                     </div>
                                 </div>

                                 {/* Status & Findings */}
                                 {vr && (
                                     <div className="flex flex-col items-end md:w-1/3 shrink-0">
                                         <div className="mb-2">{getStatusBadge(vr.status)}</div>
                                         <div className="text-right w-full">
                                            {vr.findings?.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {vr.findings.map((finding, idx) => (
                                                        <li key={idx} className={`text-xs ${vr.status === 'Complete' ? 'text-green-700' : 'text-orange-700'} flex items-start justify-end gap-1.5`}>
                                                            <span className="text-right">{finding}</span>
                                                            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${vr.status === 'Complete' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-xs text-gray-500 italic">No specific findings listed.</span>
                                            )}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                     );
                 })}
             </div>
         )}
      </div>

    </div>
  );
}
