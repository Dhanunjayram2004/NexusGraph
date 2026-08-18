import React from 'react';
import { Layers, Users, Zap, Compass } from 'lucide-react';

export default function Hero({ projectsCount, recruitingCount, activeDomain, onSelectDomain }) {
  const domains = ['All', 'Computer Vision', 'Game Development', 'VLSI', 'Machine Learning'];

  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-tag">
          <Zap size={14} /> Powered by CognoDB Graph Engine
        </div>
        <h1 className="hero-headline">
          Build projects. <span className="gradient-text">Build experience.</span>
        </h1>
        <p className="hero-subtitle">
          Connect with experienced creators, find graph-recommended teammates matching your skills,
          and gain verified project experience.
        </p>

        <div className="hero-stats">
          <div className="stat-card">
            <Layers size={18} />
            <div>
              <span className="stat-number">{projectsCount}</span>
              <span className="stat-label">Active Graph Projects</span>
            </div>
          </div>
          <div className="stat-card">
            <Users size={18} />
            <div>
              <span className="stat-number">{recruitingCount}</span>
              <span className="stat-label">Teams Recruiting</span>
            </div>
          </div>
          <div className="stat-card">
            <Compass size={18} />
            <div>
              <span className="stat-number">2-Hop</span>
              <span className="stat-label">Multi-Hop Matching</span>
            </div>
          </div>
        </div>

        <div className="domain-pills">
          <span className="filter-label">Filter Domain:</span>
          {domains.map((d) => (
            <button
              key={d}
              className={`pill-btn ${activeDomain === d || (d === 'All' && !activeDomain) ? 'active' : ''}`}
              onClick={() => onSelectDomain(d === 'All' ? null : d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}