'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

interface Assignment {
    id: string;
    patient_id: string;
    patient_name?: string;
    status: string;
    created_at: string;
    completed_at?: string;
    risk_level?: string;
}

interface Template {
    id: string;
    title: string;
}

const STATUS_STYLES: Record<string, string> = {
    SENT: 'bg-blue-100 text-blue-700',
    OPENED: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-slate-100 text-slate-500',
};

export default function SubmissionsPage() {
    const params = useParams();
    const locale = params.locale as string || 'en';
    const templateId = params.id as string;

    const [template, setTemplate] = useState<Template | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [templateId]);

    async function loadData() {
        setLoading(true);
        try {
            // Get template info
            const templateRes = await fetch(
                `${API_URL}/forms/admin/templates/${templateId}`,
                { credentials: 'include' }
            );
            if (templateRes.ok) {
                const data = await templateRes.json();
                setTemplate({ id: data.id, title: data.title });
            }

            // Get assignments for this template
            // Note: This endpoint needs to be created or we fetch all and filter
            const assignRes = await fetch(
                `${API_URL}/forms/assignments/template/${templateId}`,
                { credentials: 'include' }
            );
            if (assignRes.ok) {
                const data = await assignRes.json();
                setAssignments(data.assignments || []);
            }
        } catch (err) {
            console.error('Error loading submissions', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={`/${locale}/forms`}
                        className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
                    >
                        ← Back to Forms
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {template?.title || 'Form'} Submissions
                    </h1>
                    <p className="text-slate-500">{assignments.length} responses</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {assignments.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <div className="text-4xl mb-4">📭</div>
                            <p>No submissions yet</p>
                            <p className="text-sm mt-2">Share your form link to start collecting responses</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Patient</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Risk</th>
                                    <th className="py-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((assignment) => (
                                    <tr
                                        key={assignment.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-slate-800">
                                                {assignment.patient_name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[assignment.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {assignment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-500">
                                            {assignment.completed_at
                                                ? new Date(assignment.completed_at).toLocaleDateString()
                                                : new Date(assignment.created_at).toLocaleDateString()
                                            }
                                        </td>
                                        <td className="py-3 px-4">
                                            {assignment.risk_level && assignment.risk_level !== 'LOW' && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                        assignment.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    ⚠️ {assignment.risk_level}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link
                                                href={`/${locale}/patients/${assignment.patient_id}`}
                                                className="text-slate-600 hover:text-slate-800 text-sm"
                                            >
                                                View Patient →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
