'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ClinicalEntry } from '@/types/auth';
import MarkdownRenderer from './ui/MarkdownRenderer';
import RichTextEditor from './ui/RichTextEditor';

interface AIAnalysis {
  id: string;
  text: string;
  date: string;
  model?: string;
}

interface TimelineEntryProps {
  entry: ClinicalEntry;
  onDelete?: (id: string) => void;
  onEdit?: (entry: ClinicalEntry) => void;
  onUpdateContent?: (entryId: string, content: string) => Promise<void>;
  onAnalyze?: (entry: ClinicalEntry) => Promise<void>;
  onSaveAnalysis?: (entryId: string, analysis: string) => Promise<void>;
  onUpdateAnalysis?: (entryId: string, analysisId: string, text: string) => Promise<void>;
  onDeleteAnalysis?: (entryId: string, analysisId: string) => Promise<void>;
}

// Clean SVG icons (Material Design style)
const Icons = {
  note: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  brain: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  sparkles: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  loading: (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
};

const ENTRY_ICONS: Record<string, React.ReactNode> = {
  SESSION_NOTE: Icons.note,
  AUDIO: Icons.audio,
  DOCUMENT: Icons.document,
  AI_ANALYSIS: Icons.brain,
  ASSESSMENT: Icons.chart,
  FORM_SUBMISSION: Icons.document,
};

const ENTRY_COLORS: Record<string, string> = {
  SESSION_NOTE: 'bg-blue-50 text-blue-600 border-blue-200',
  AUDIO: 'bg-amber-50 text-amber-600 border-amber-200',
  DOCUMENT: 'bg-slate-50 text-slate-600 border-slate-200',
  AI_ANALYSIS: 'bg-purple-50 text-purple-600 border-purple-200',
  ASSESSMENT: 'bg-green-50 text-green-600 border-green-200',
  FORM_SUBMISSION: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

const MAX_LINES = 10;
const LINE_HEIGHT = 20; // ~20px per line

export default function TimelineEntry({ entry, onDelete, onEdit, onUpdateContent, onAnalyze, onSaveAnalysis, onUpdateAnalysis, onDeleteAnalysis }: TimelineEntryProps) {
  const t = useTranslations('ClinicalJournal');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [editingAnalysisText, setEditingAnalysisText] = useState('');

  // Saved analyses from entry_metadata (array)
  const savedAnalyses: AIAnalysis[] = entry.entry_metadata?.ai_analyses || [];

  // Pending (unsaved) analysis
  const [pendingAnalysis, setPendingAnalysis] = useState<string | null>(null);

  const [contentExpanded, setContentExpanded] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [isContentTruncated, setIsContentTruncated] = useState(false);
  const [formAnswersExpanded, setFormAnswersExpanded] = useState(false);

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content || '');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const contentRef = useRef<HTMLParagraphElement>(null);

  const icon = ENTRY_ICONS[entry.entry_type] || Icons.note;
  const colorClass = ENTRY_COLORS[entry.entry_type] || ENTRY_COLORS.SESSION_NOTE;
  const label = t(`entryTypes.${entry.entry_type}` as any) || entry.entry_type;
  const happenedAt = new Date(entry.happened_at).toLocaleString();

  // Check if content needs truncation
  useEffect(() => {
    if (contentRef.current) {
      const lineCount = contentRef.current.scrollHeight / LINE_HEIGHT;
      setIsContentTruncated(lineCount > MAX_LINES);
    }
  }, [entry.content]);

  // Reset analyzing state when backend starts processing
  useEffect(() => {
    if (entry.processing_status === 'PENDING' || entry.processing_status === 'PROCESSING') {
      setAnalyzing(false); // Backend took over, reset local state
    }
  }, [entry.processing_status]);

  async function handleAnalyze() {
    if (!onAnalyze) return;
    setAnalyzing(true);
    try {
      await onAnalyze(entry);
      // Backend saves the analysis directly, just expand the section
      setAnalysisExpanded(true);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveAnalysis() {
    if (!onSaveAnalysis || !pendingAnalysis) return;
    setSaving(true);
    try {
      await onSaveAnalysis(entry.id, pendingAnalysis);
      setPendingAnalysis(null); // Clear pending after save
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAnalysis(analysisId: string) {
    if (!onDeleteAnalysis) return;
    setDeleting(analysisId);
    try {
      await onDeleteAnalysis(entry.id, analysisId);
    } finally {
      setDeleting(null);
    }
  }

  const isProcessing = entry.processing_status === 'PENDING' || entry.processing_status === 'PROCESSING';
  const canAnalyze = onAnalyze && entry.entry_type !== 'AI_ANALYSIS' && !isProcessing;
  const hasAnalyses = savedAnalyses.length > 0 || pendingAnalysis;

  function handleStartEdit() {
    setEditContent(entry.content || '');
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!onUpdateContent) return;
    setSavingEdit(true);
    try {
      await onUpdateContent(entry.id, editContent);
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  function handleCancelEdit() {
    setEditContent(entry.content || '');
    setIsEditing(false);
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          {/* Type Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${colorClass}`}>
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">{happenedAt}</span>
              {entry.is_private && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t('private')}</span>
              )}
              {/* Processing status indicator */}
              {(entry.processing_status === 'PENDING' || entry.processing_status === 'PROCESSING') && (
                <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full animate-pulse">
                  {Icons.loading}
                  <span>{entry.processing_status === 'PENDING' ? 'En cola...' : 'Analizando...'}</span>
                </span>
              )}
              {entry.processing_status === 'FAILED' && (
                <button
                  onClick={() => setShowErrorModal(true)}
                  className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-200 transition-colors"
                >
                  ⚠️ Error
                </button>
              )}
            </div>

            {/* Entry text with truncation or editing */}
            {entry.content && (
              <div className="relative">
                {isEditing ? (
                  <div className="space-y-2">
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Escribe tu nota..."
                      minHeight="150px"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {savingEdit ? Icons.loading : Icons.save}
                        <span>{savingEdit ? t('saving') : t('save')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      ref={contentRef}
                      className="text-slate-700 text-sm leading-relaxed"
                      style={!contentExpanded && isContentTruncated ? {
                        display: '-webkit-box',
                        WebkitLineClamp: 10,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      } : undefined}
                    >
                      <MarkdownRenderer content={entry.content} />
                    </div>
                    {isContentTruncated && (
                      <button
                        onClick={() => setContentExpanded(!contentExpanded)}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{contentExpanded ? t('seeLess') : t('seeMore')}</span>
                        <span className={`transform transition-transform ${contentExpanded ? 'rotate-180' : ''}`}>
                          {Icons.chevronDown}
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Form Submission Answers */}
            {entry.entry_type === 'FORM_SUBMISSION' && entry.entry_metadata?.answers && (
              <div className="mt-2">
                <button
                  onClick={() => setFormAnswersExpanded(!formAnswersExpanded)}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <span className="font-medium">
                    {entry.entry_metadata.form_title || 'Form Answers'}
                  </span>
                  <span className={`transform transition-transform ${formAnswersExpanded ? 'rotate-180' : ''}`}>
                    {Icons.chevronDown}
                  </span>
                </button>
                {formAnswersExpanded && (
                  <div className="mt-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-3">
                    {Object.entries(entry.entry_metadata.answers).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-slate-700 mt-0.5">
                          {typeof value === 'boolean' ? (value ? '✓ Sí' : '✗ No') : String(value)}
                        </span>
                      </div>
                    ))}
                    {entry.entry_metadata.risk_level && (
                      <div className="pt-2 border-t border-emerald-200">
                        <span className="text-xs font-medium text-slate-500">Nivel de riesgo: </span>
                        <span className={`text-xs font-semibold ${entry.entry_metadata.risk_level === 'HIGH' ? 'text-red-600' :
                          entry.entry_metadata.risk_level === 'MEDIUM' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                          {entry.entry_metadata.risk_level}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* File link */}
            {entry.entry_metadata?.file_url && (() => {
              const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8001';
              const fullUrl = `${backendBase}${entry.entry_metadata.file_url}`;
              return (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {Icons.link}
                  <span>{entry.entry_metadata.filename || t('attachedFile')}</span>
                </a>
              );
            })()}
          </div>

          {/* Actions (Right side) */}
          <div className="flex items-center gap-1">
            {/* Analyze button */}
            {canAnalyze && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title={t('analyzeWithAI')}
              >
                {analyzing ? Icons.loading : Icons.sparkles}
                <span className="hidden sm:inline">{analyzing ? t('analyzing') : 'IA'}</span>
              </button>
            )}

            {/* Edit button */}
            {onUpdateContent && entry.entry_type === 'SESSION_NOTE' && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title={t('edit') || 'Edit'}
              >
                {Icons.edit}
              </button>
            )}

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title={t('confirmDeleteEntry')}
              >
                {Icons.trash}
              </button>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        {hasAnalyses && (
          <div className="border-t border-slate-100 p-4 bg-gradient-to-r from-purple-50 to-white">
            <button
              onClick={() => setAnalysisExpanded(!analysisExpanded)}
              className="w-full flex items-center justify-between mb-3 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="text-purple-600">{Icons.sparkles}</div>
                <span className="text-sm font-medium text-purple-700">{t('analysisComplete')}</span>
                <span className="text-xs text-purple-400">({savedAnalyses.length + (pendingAnalysis ? 1 : 0)})</span>
              </div>
              <div className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                <span>{analysisExpanded ? t('collapse') : t('expand')}</span>
                <span className={`transform transition-transform ${analysisExpanded ? 'rotate-180' : ''}`}>
                  {Icons.chevronDown}
                </span>
              </div>
            </button>

            {analysisExpanded && (
              <div className="space-y-4">
                {/* Saved analyses */}
                {savedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="bg-white border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-400">
                          {new Date(analysis.date).toLocaleDateString()}
                        </span>
                        {analysis.model && (
                          <span className="text-xs text-purple-300 bg-purple-50 px-1.5 py-0.5 rounded">
                            {analysis.model}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {onUpdateAnalysis && editingAnalysisId !== analysis.id && (
                          <button
                            onClick={() => {
                              setEditingAnalysisId(analysis.id);
                              setEditingAnalysisText(analysis.text);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                          >
                            {Icons.edit}
                            <span>{t('edit')}</span>
                          </button>
                        )}
                        {onDeleteAnalysis && editingAnalysisId !== analysis.id && (
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            disabled={deleting === analysis.id}
                            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {deleting === analysis.id ? Icons.loading : Icons.trash}
                            <span>{t('delete')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {editingAnalysisId === analysis.id ? (
                      <div className="space-y-2">
                        <RichTextEditor
                          value={editingAnalysisText}
                          onChange={setEditingAnalysisText}
                          placeholder="Edita el análisis..."
                          minHeight="150px"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingAnalysisId(null)}
                            className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            onClick={async () => {
                              if (onUpdateAnalysis) {
                                setSaving(true);
                                await onUpdateAnalysis(entry.id, analysis.id, editingAnalysisText);
                                setEditingAnalysisId(null);
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {saving ? Icons.loading : Icons.save}
                            <span>{saving ? t('saving') : t('save')}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/60 rounded-lg p-3 border-l-2 border-purple-200">
                        <MarkdownRenderer content={analysis.text} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Pending (new) analysis */}
                {pendingAnalysis && (
                  <div className="bg-white border-2 border-dashed border-purple-200 rounded-lg p-3">
                    <div className="text-xs text-purple-500 mb-2 font-medium">{t('newAnalysis')}</div>
                    <RichTextEditor
                      value={pendingAnalysis}
                      onChange={setPendingAnalysis}
                      placeholder="Escribe el análisis..."
                      minHeight="120px"
                    />
                    <div className="flex justify-center gap-3 mt-3">
                      <button
                        onClick={handleSaveAnalysis}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saving ? Icons.loading : Icons.save}
                        <span>{saving ? t('saving') : t('save')}</span>
                      </button>
                      <button
                        onClick={() => setPendingAnalysis(null)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {Icons.trash}
                        <span>{t('cancel')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div> {/* This closes the main div for the entry */}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowErrorModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            {entry.processing_error?.toLowerCase().includes('credits') ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Créditos Insuficientes</h3>
                    <p className="text-sm text-slate-500">No tienes suficientes créditos para este análisis</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">{entry.processing_error}</p>
                </div>
                <div className="flex gap-3">
                  <a
                    href="/es/settings/billing"
                    className="flex-1 px-4 py-2 text-center text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    Ver Planes
                  </a>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Error en el Análisis</h3>
                    <p className="text-sm text-slate-500">No se pudo completar el análisis de IA</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 font-mono">{entry.processing_error || 'Error desconocido'}</p>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full px-4 py-2 text-white bg-slate-600 hover:bg-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
