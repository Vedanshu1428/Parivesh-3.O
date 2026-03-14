import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, MapPin, TreePine, Droplets } from 'lucide-react';
import { SatelliteReport } from '../../../backend/src/services/satellite.service';

interface EnvironmentalRiskReportProps {
  report: SatelliteReport;
}

export default function EnvironmentalRiskReport({ report }: EnvironmentalRiskReportProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'LOW': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRiskGradient = (level: string) => {
    switch (level) {
      case 'HIGH': return 'from-red-500 to-red-600 shadow-red-500/20';
      case 'MEDIUM': return 'from-orange-500 to-orange-600 shadow-orange-500/20';
      case 'LOW': return 'from-green-500 to-green-600 shadow-green-500/20';
      default: return 'from-gray-500 to-gray-600 shadow-gray-500/20';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Geospatial Analysis
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Automated Satellite Verification</p>
        </div>
        
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${getRiskColor(report.riskLevel)}`}>
          {report.riskLevel} RISK
        </div>
      </div>

      <div className="p-5 flex-1 space-y-6">
        {/* Score visualization */}
        <div className="flex items-center gap-6">
          <div className="shrink-0 relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="36" className="stroke-gray-100" strokeWidth="8" fill="none" />
              <circle 
                cx="48" 
                cy="48" 
                r="36" 
                className={`stroke-current ${
                  report.riskLevel === 'HIGH' ? 'text-red-500' : report.riskLevel === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'
                } transition-all duration-1000 ease-out`} 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray={`${(report.riskScore / 10) * 226} 226`} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{report.riskScore}</span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Score</span>
            </div>
          </div>
          
          <div className="space-y-3">
             {/* Key Metrics */}
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${report.hasForest ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                 <TreePine className="w-4 h-4" />
               </div>
               <div>
                  <div className="text-sm font-medium text-gray-900">Forest Proximity</div>
                  <div className="text-xs text-gray-500">
                    {report.hasForest ? `Detected within ${report.radiusMeters/1000}km` : 'Clear'}
                  </div>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${report.hasWaterBody ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                 <Droplets className="w-4 h-4" />
               </div>
               <div>
                  <div className="text-sm font-medium text-gray-900">Water Body Proximity</div>
                  <div className="text-xs text-gray-500">
                    {report.hasWaterBody ? `Detected within ${report.radiusMeters/1000}km` : 'Clear'}
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Actionable Insights / Hacks */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">System Findings</h3>
          
          {report.findings.length > 0 ? (
            report.findings.map((finding, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="flex items-start gap-3 p-3 bg-orange-50/50 border border-orange-100 rounded-lg"
              >
                <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-sm text-gray-800 leading-tight">
                  <span className="font-semibold text-orange-700">Warning:</span> {finding}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="flex items-start gap-3 p-3 bg-green-50/50 border border-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 leading-tight">
                  No immediate environmental collision warnings detected in the vicinity.
                </p>
            </div>
          )}
        </div>

      </div>

      <div className={`p-4 mt-auto border-t border-gray-100 flex items-center gap-3 bg-gradient-to-r ${getRiskGradient(report.riskLevel)} text-white`}>
          {report.riskLevel === 'HIGH' ? (
             <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
             <Info className="w-5 h-5 shrink-0" />
          )}
          <p className="text-sm font-medium">
             {report.riskLevel === 'HIGH' 
               ? 'Manual field verification strongly recommended prior to clearance.'
               : 'Standard scrutiny procedures apply.'}
          </p>
      </div>
    </div>
  );
}
