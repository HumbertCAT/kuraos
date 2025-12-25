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
    <div className="bg-card p-4 rounded-lg border border-border mb-6">
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

        <label className="px-4 py-2 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors text-muted-foreground flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          {t('uploadFile')}
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
