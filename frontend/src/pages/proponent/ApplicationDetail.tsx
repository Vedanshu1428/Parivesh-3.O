import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle, AlertTriangle, UploadCloud,
  CreditCard, ArrowLeft, RefreshCw, MapPin, Send, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import DocumentUpload from '../../components/DocumentUpload';
import GISMap from '../../components/GISMap';
import { useApplicationPrediction } from '../../hooks/usePrediction';
import ApprovalChanceBadge from '../../components/ApprovalChanceBadge';
import PredictionCard from '../../components/PredictionCard';

const STAGE_LABELS = [
  { status: 'DRAFT',          label: 'Draft Created',          icon: FileText    },
  { status: 'SUBMITTED',      label: 'Application Submitted',  icon: UploadCloud },
  { status: 'UNDER_SCRUTINY', label: 'Under Scrutiny',         icon: Clock       },
  { status: 'EDS',            label: 'Document Deficiency',    icon: AlertTriangle },
  { status: 'REFERRED',       label: 'Referred to Meeting',    icon: Send        },
  { status: 'MOM_GENERATED',  label: 'MoM Generated',          icon: FileText    },
  { status: 'FINALIZED',      label: 'Finalized',              icon: CheckCircle },
];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const app = data;
  const { data: prediction, isLoading: isPredictionLoading, error: predictionError } = useApplicationPrediction(id);

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/applications/${id}/submit`),
    onSuccess: () => {
      toast.success('Application submitted!');
      void queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message || 'Submission failed'),
  });

  const resubmitMutation = useMutation({
    mutationFn: () => api.post(`/applications/${id}/resubmit`),
    onSuccess: () => {
      toast.success('Application resubmitted for scrutiny!');
      void queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
    onError: () => toast.error('Resubmission failed'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) return <p className="text-gray-500 text-center py-8">Application not found</p>;

  const currentStageIdx = STAGE_LABELS.findIndex(s => s.status === app.status);
  const canEdit   = app.status === 'DRAFT' || app.status === 'EDS';
  const canSubmit = app.status === 'DRAFT';
  const canResubmit = app.status === 'EDS';

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Premium Header */}
      <div className="relative bg-slate-900 rounded-3xl p-6 lg:p-8 mb-8 text-white shadow-xl overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <StatusBadge status={app.status} />
              <ApprovalChanceBadge 
                chance={prediction ? prediction.approvalChance : undefined} 
                days={prediction ? prediction.estimatedDays : undefined} 
                loading={isPredictionLoading} 
              />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 text-white">{app.projectName}</h1>
            <p className="text-slate-300 flex items-center gap-2 text-sm lg:text-base font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {app.district}, {app.state}
              <span className="text-slate-600 mx-1">•</span>
              <span className="text-primary-300">{app.sector}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {app.status !== 'DRAFT' && !app.feePaid && (
              <Link
                to={`/dashboard/proponent/payment/${app.id}`}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                <CreditCard className="w-4 h-4" /> Pay Fee
              </Link>
            )}
            {canSubmit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending ? 'Submitting…' : 'Submit Application'}
              </motion.button>
            )}
            {canResubmit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (confirm('Resubmit application for scrutiny? Ensure all deficiencies are addressed.')) {
                    resubmitMutation.mutate();
                  }
                }}
                disabled={resubmitMutation.isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-primary-400 hover:to-primary-500 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                {resubmitMutation.isPending ? 'Resubmitting…' : 'Resubmit for Scrutiny'}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">

        {/* Row 1: Project Overview (Left) + App Track (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Project Details */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 h-full">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Project Overview
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  ['Project ID',  <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{app.id.slice(0, 12)}…</span>],
                  ['Sector',      app.sector],
                  ['District',    app.district],
                  ['Area',        app.areaHa ? `${app.areaHa} ha` : '—'],
                  ['Investment',  app.investmentCr ? `₹${app.investmentCr} Cr` : '—'],
                  ['Employment',  app.employmentCount ? `${app.employmentCount} persons` : '—'],
                  ['Fee Amount',  app.feeAmount ? `₹${Number(app.feeAmount).toLocaleString()}` : 'TBD'],
                  ['Fee Status',  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${app.feePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{app.feePaid ? '✓ Paid' : 'Pending'}</span>],
                  ['Created On',  format(new Date(app.createdAt), 'dd MMMM yyyy')],
                  ...(app.submittedAt ? [['Submitted On', format(new Date(app.submittedAt), 'dd MMMM yyyy')]] : []),
                ].map(([label, value], i) => (
                  <div key={i} className="flex flex-col border-b border-slate-100 pb-3">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</span>
                    <span className="font-semibold text-slate-900 text-[15px]">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {app.description && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-2">Description</span>
                  <p className="text-slate-700 leading-relaxed">{app.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Timeline & SLA */}
          <div className="lg:col-span-4 space-y-6">
            {/* SLA Card */}
            {app.slaDeadline && (
              <div className={`rounded-2xl p-5 border shadow-sm ${
                new Date(app.slaDeadline) < new Date()
                  ? 'bg-rose-50/50 border-rose-100'
                  : 'bg-emerald-50/50 border-emerald-100'
              }`}>
                <div className={`font-bold mb-1 flex items-center gap-2 ${
                  new Date(app.slaDeadline) < new Date() ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  <Clock className="w-5 h-5" /> SLA Deadline
                </div>
                <div className={`text-sm font-medium ${
                  new Date(app.slaDeadline) < new Date() ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {format(new Date(app.slaDeadline), 'dd MMMM yyyy')}
                </div>
              </div>
            )}

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 h-full">
              <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                 Application Track
              </h2>
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
                {STAGE_LABELS.map((stage, i) => {
                  const isDone    = i < currentStageIdx;
                  const isCurrent = i === currentStageIdx;
                  const isSkipped = app.status !== 'EDS' && stage.status === 'EDS' && !isDone && !isCurrent;

                  const eventMap: Record<string, string> = {
                    DRAFT:          'APPLICATION_CREATED',
                    SUBMITTED:      'APPLICATION_SUBMITTED',
                    UNDER_SCRUTINY: 'SCRUTINY_STARTED',
                    EDS:            'EDS_ISSUED',
                    REFERRED:       'APPLICATION_REFERRED',
                    MOM_GENERATED:  'GIST_GENERATED',
                    FINALIZED:      'MOM_FINALIZED',
                  };
                  const event = (app.auditEvents || [])?.find((e: { eventType: string; createdAt: string }) =>
                    e.eventType === eventMap[stage.status]
                  );

                  return (
                    <div key={stage.status} className={`relative pl-8 ${isSkipped ? 'opacity-40' : ''}`}>
                      {/* Circle Node */}
                      <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-colors duration-300 ${
                        isDone ? 'bg-emerald-500 text-white' : 
                        isCurrent ? 'bg-primary border-primary-50 text-white' : 
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? '✓' : <stage.icon className="w-3.5 h-3.5" />}
                      </div>
                      
                      {/* Text content */}
                      <div>
                        <h4 className={`text-sm font-bold ${
                          isCurrent ? 'text-primary-700' : isDone ? 'text-slate-900' : 'text-slate-500'
                        }`}>
                          {stage.label}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium">
                          {event ? format(new Date(event.createdAt), 'dd MMM yyyy, hh:mm a') : (isCurrent ? 'Current Phase' : 'Pending')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Prediction Engine */}
        <div className="w-full">
          <PredictionCard 
            prediction={prediction} 
            isLoading={isPredictionLoading}
            error={predictionError as Error | null}
          />
        </div>

        {/* Row 3: Geographic Location */}
        {app.lat && app.lng && (
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Geographic Location
              </h2>
            </div>
            <GISMap
              lat={app.lat}
              lng={app.lng}
              riskFlags={app.gisRiskFlags ?? []}
              height="320px"
            />
          </div>
        )}

        {/* Row 4: Supported Documents (Expandable) */}
        <details className="group w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" open>
          <summary className="p-6 lg:px-8 bg-slate-50 cursor-pointer flex flex-wrap justify-between items-center outline-none list-none [&::-webkit-details-marker]:hidden border-b border-transparent group-open:border-slate-200 transition-colors select-none">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Supported Documents
              <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full ml-1">
                {app.documents?.length || 0}
              </span>
            </h2>
            <div className="flex items-center gap-4">
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowUpload(o => !o);
                    e.currentTarget.closest('details')?.setAttribute('open', '');
                  }}
                  className="text-sm flex items-center gap-2 font-semibold text-primary bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  {showUpload ? 'Hide Uploader' : 'Add Document'}
                </button>
              )}
              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
            </div>
          </summary>
          <div className="p-6 lg:p-8 bg-white">
            <DocumentUpload
              applicationId={app.id}
              sector={app.sector}
              existingDocs={app.documents ?? []}
              canUpload={canEdit && showUpload}
            />
          </div>
        </details>

        {/* Row 5: EDS Notices (Expandable) */}
        {app.edsNotices?.length > 0 && (
          <details className="group w-full bg-rose-50/20 rounded-2xl border border-rose-200 shadow-sm overflow-hidden" open>
            <summary className="p-6 lg:px-8 bg-rose-50/80 cursor-pointer flex justify-between items-center outline-none list-none [&::-webkit-details-marker]:hidden border-b border-rose-100 transition-colors select-none">
              <h2 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Document Deficiency Notices
              </h2>
              <ChevronDown className="w-5 h-5 text-rose-400 group-open:rotate-180 transition-transform" />
            </summary>
            
            <div className="p-6 lg:p-8">
              <div className="space-y-6">
                {app.edsNotices.map((notice: {
                  id: string;
                  deficiencies: { field: string; reason: string }[];
                  issuedAt: string;
                  issuedBy: { name: string };
                  resolvedAt: string | null;
                  pdfUrl?: string | null;
                }) => (
                  <div key={notice.id} className="bg-white rounded-xl p-5 border border-rose-100 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md inline-block">
                          Issued {format(new Date(notice.issuedAt), 'dd MMM yyyy')} by {notice.issuedBy.name}
                        </p>
                      </div>
                      {notice.pdfUrl && (
                         <a 
                           href={notice.pdfUrl.startsWith('http') ? notice.pdfUrl : `${api.defaults.baseURL?.replace('/api', '')}${notice.pdfUrl}`}
                           target="_blank" 
                           rel="noreferrer"
                           className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                         >
                           <FileText className="w-4 h-4" /> Download Official Notice
                         </a>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {Array.isArray(notice.deficiencies) && notice.deficiencies.map((d, i) => (
                        <div key={i} className="flex gap-3 items-start bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{String(d.field)}</div>
                            <div className="text-slate-600 text-sm mt-0.5">{String(d.reason)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {notice.resolvedAt && (
                      <div className="mt-4 pt-4 border-t border-rose-50 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> Resolved {format(new Date(notice.resolvedAt), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {canResubmit && (
                <div className="mt-6 pt-5 border-t border-rose-200/60">
                  <p className="text-sm font-medium text-rose-800 mb-4">
                    Upload the required documents in the Documents section below, then press Resubmit.
                  </p>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
