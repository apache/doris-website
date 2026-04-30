import React, { JSX } from 'react';

export function HeroSection(): JSX.Element {
    return (
        <section className="home-next-hero">
            <div className="home-next-container">
                <p className="home-next-placeholder-label">Hero Section</p>
                <h1>Open Source, Real-Time Analytics and Search Database for the AI Era</h1>
                <p>Apache Doris is a database for real-time analytics and search.</p>
            </div>
        </section>
    );
}
