import { CheckCircle2, XCircle } from 'lucide-react';
import { getRequiredDocuments } from '../../../shared/documentRequirements';

interface DocumentChecklistProps {
  sector: string;
  uploadedDocs: { docType: string }[];
}

export default function DocumentChecklist({ sector, uploadedDocs }: DocumentChecklistProps) {
  const requirements = getRequiredDocuments(sector);
  const uploadedSet = new Set(uploadedDocs.map(d => d.docType));

  if (requirements.length === 0) {
    return null;
  }

  const completeCount = requirements.filter(req => uploadedSet.has(req.value)).length;
  const progress = Math.round((completeCount / requirements.length) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Required Documents Checklist</h3>
          <p className="text-sm text-gray-500 mt-1">
            Category: <span className="font-medium text-gray-700">{sector}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{progress}%</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      <div className="p-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
          {requirements.map(req => {
            const isUploaded = uploadedSet.has(req.value);
            return (
              <div 
                key={req.value} 
                className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                  isUploaded ? 'bg-green-50/50' : 'hover:bg-gray-50'
                }`}
              >
                {isUploaded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${isUploaded ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                  {req.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
