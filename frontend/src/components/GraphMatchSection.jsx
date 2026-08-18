import React from 'react';
import { Sparkles, ArrowRight, Share2, Compass } from 'lucide-react';

export default function GraphMatchSection({ recommendations, activeUser, onSelectProject }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="empty-state">
        <Compass size={40} className="empty-icon" />
        <h3>No direct graph matches found</h3>
        <p>Try switching users in the top bar to inspect personalized graph traversals.</p>
      </div>
    );
  }

  return (
    <div className="graph-match-container">
      <div className="match-banner">
        <div className="match-banner-title">
          <Sparkles size={20} className="glow-icon" />
          <div>
            <h3>Graph Recommendations for {activeUser?.name || 'You'}</h3>
            <p>Calculated via 2-hop traversals over <code>(User)-[:HAS_SKILL]-&gt;(:Skill)&lt;-[:REQUIRES_SKILL]-(:Project)</code></p>
          </div>
        </div>
      </div>

      <div className="match-grid">
        {recommendations.map((rec) => (
          <div key={rec.id} className="match-card" onClick={() => onSelectProject(rec)}>
            <div className="match-score-badge">
              <Share2 size={13} /> {rec.graph_score} Match Score
            </div>
            <h4>{rec.title}</h4>
            <p className="match-desc">{rec.description}</p>

            <div className="match-graph-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Matching Skills:</span>
                <span className="breakdown-value">
                  {rec.matching_skills?.length > 0 ? rec.matching_skills.join(', ') : 'Complementary'}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Matching Domain:</span>
                <span className="breakdown-value">
                  {rec.matching_domains?.length > 0 ? rec.matching_domains.join(', ') : rec.domain}
                </span>
              </div>
            </div>

            <div className="match-reason-quote">
              &ldquo;{rec.match_reason}&rdquo;
            </div>

            <div className="match-footer">
              <span>{rec.current_members} / {rec.required_members} joined</span>
              <span className="view-link">View Match <ArrowRight size={14} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}