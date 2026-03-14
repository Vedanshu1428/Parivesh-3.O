import { motion } from 'framer-motion';
import { CheckCircle, Search, FileText, Bot, ShieldCheck } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Document Upload', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'scan', label: 'ClamAV Security Scan', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'ocr', label: 'Tesseract OCR', icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'classify', label: 'HuggingFace Classifier', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'complete', label: 'Completeness Check', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
];

export default function DocumentVerificationPipeline() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">Intelligent Verification Pipeline</h2>
        <p className="text-xs text-gray-500">
          Automated pre-scrutiny extraction, classification, and validation.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
          
          {PIPELINE_STEPS.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm w-full md:w-32 z-10 shrink-0"
            >
              <div className={`w-10 h-10 rounded-full ${step.bg} ${step.color} flex items-center justify-center shrink-0`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
         <Bot className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
         <p>
           Documents listed below have already passed through this pipeline. 
           Deficiencies are auto-flagged prior to manual review.
         </p>
      </div>
    </div>
  );
}
