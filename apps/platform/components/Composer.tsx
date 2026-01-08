'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import AudioRecorder from './AudioRecorder';
import PhotoCapture from './PhotoCapture';
import RichTextEditor from './ui/RichTextEditor';

interface ComposerProps {
  patientId: string;
  onEntryCreated: () => void;
}

export default function Composer({ patientId, onEntryCreated }: ComposerProps) {
  const t = useTranslations('ClinicalJournal');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAddNote() {
    if (!content.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.clinicalEntries.create({
        patient_id: patientId,
        entry_type: 'SESSION_NOTE',
        content: content.trim(),
      });
      setContent('');
      onEntryCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  }

  async function uploadFile(file: File | Blob, filename?: string) {
    setUploadLoading(true);
    setLoading(true);
    setError('');

    try {
      // Convert Blob to File if needed
      const fileToUpload = file instanceof File
        ? file
        : new File([file], filename || `recording_${Date.now()}.webm`, { type: file.type });

      // 1. Upload file
      const uploadResult = await api.uploads.upload(fileToUpload);

      // 2. Create clinical entry with file reference
      const entryType = fileToUpload.type.startsWith('audio/') ? 'AUDIO'
        : fileToUpload.type.startsWith('image/') ? 'DOCUMENT'
          : 'DOCUMENT';

      await api.clinicalEntries.create({
        patient_id: patientId,
        entry_type: entryType,
        content: null,
        entry_metadata: {
          file_url: uploadResult.url,
          filename: uploadResult.filename,
          size: uploadResult.size,
          content_type: uploadResult.content_type,
        },
      });

      onEntryCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadLoading(false);
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleAudioRecording(audioBlob: Blob) {
    const filename = `audio_${Date.now()}.webm`;
    await uploadFile(audioBlob, filename);
  }

  async function handlePhotoCapture(photoBlob: Blob) {
    const filename = `photo_${Date.now()}.jpg`;
    await uploadFile(photoBlob, filename);
  }

  return (
    <div className="bg-card p-4 rounded-lg border border-border mb-6 relative overflow-hidden">
      {uploadLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-foreground animate-pulse">Sincronizando archivo pesado...</span>
          </div>
          <p className="text-[10px] text-muted-foreground">No cierres esta ventana mientras el Muro procesa el archivo.</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder={t('notePlaceholder')}
        minHeight="100px"
        disabled={loading}
      />

      <div className="flex flex-wrap gap-3 mt-3">
        <button
          onClick={handleAddNote}
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          {t('addNote')}
        </button>

        <label className={`px-4 py-2 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors text-muted-foreground flex items-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          )}
          {loading ? t('uploading') : t('uploadFile')}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="audio/*,application/pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            disabled={loading}
          />
        </label>

        <AudioRecorder
          onRecordingComplete={handleAudioRecording}
          disabled={loading}
        />

        <PhotoCapture
          onPhotoCapture={handlePhotoCapture}
          disabled={loading}
        />
      </div>
    </div >
  );
}
