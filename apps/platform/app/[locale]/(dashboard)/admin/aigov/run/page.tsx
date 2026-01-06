'use client';

import AiGovernance from '../../components/AiGovernance';

/**
 * AIGov Run page
 * Renders the full AiGovernance component with Run tab selected
 */
export default function AiGovRunPage() {
    return (
        <section className="card p-6">
            <AiGovernance defaultSection="run" />
        </section>
    );
}
