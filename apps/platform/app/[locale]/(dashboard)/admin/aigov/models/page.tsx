'use client';

import AiGovernance from '../components/AiGovernance';

/**
 * AIGov Models page
 * Renders the full AiGovernance component (models section is default)
 */
export default function AiGovModelsPage() {
    return (
        <section className="card p-6">
            <AiGovernance defaultSection="models" />
        </section>
    );
}
