import React from 'react';
import { Users, Code, Cpu, ChevronRight, UserPlus, Sparkles, Check } from 'lucide-react';

export default function ProjectCard({ 
  project, 
  onViewDetails, 
  onJoin, 
  onLeave,
  currentUserId, 
  isFull,
  isPending
}) {
  // Creator occupies a seat too, but only has a CREATED relationship (not JOINED),
  // so current_members from the backend excludes them. Account for that here so the
  // capacity bar / seat count matches what's actually shown in the member list.
// Ensure we check for creator_id and cap the seats
  const creatorExists = project.creator || project.creator_id;
  const rawSeats = (project.current_members || 0) + (creatorExists ? 1 : 0);
  const required = project.required_members || 3;
  const isCreator =
  project.creator?.id === currentUserId ||
  project.creator_id === currentUserId;
  
  const occupiedSeats = Math.min(rawSeats, required);
  const capacityPct = Math.min(100, Math.round((occupiedSeats / required) * 100));
  
  const isRecruiting = project.status === 'Recruiting';
  // Check if actually full based on raw seats to disable button
  const actualIsFull = rawSeats >= required;

  return (
    <div className={`project-card ${!isRecruiting ? 'status-active' : ''}`}>
      <div className="card-header">
        <div className="domain-badge">{project.domain || 'Engineering'}</div>
        <span className={`status-badge ${isRecruiting ? 'badge-recruiting' : 'badge-active'}`}>
          <span className="status-dot"></span>
          {project.status || 'Recruiting'}
        </span>
      </div>

      <h3 className="card-title" onClick={() => onViewDetails(project)}>
        {project.title}
      </h3>
      <p className="card-desc">
        {project.description || 'Hands-on collaborative graph engineering project for freshers.'}
      </p>

      {/* Graph match reason if in recommendation mode */}
      {project.match_reason && (
        <div className="card-match-reason">
          <Sparkles size={14} />
          <span>{project.match_reason}</span>
        </div>
      )}

      {/* Skills & Technologies */}
      <div className="tag-group">
        <div className="tag-subgroup">
          <span className="tag-header"><Code size={12} /> Skills</span>
          <div className="chips">
            {(project.skills || []).map((s, i) => (
              <span key={i} className="chip chip-skill">{s}</span>
            ))}
          </div>
        </div>
        <div className="tag-subgroup">
          <span className="tag-header"><Cpu size={12} /> Tech</span>
          <div className="chips">
            {(project.technologies || []).map((t, i) => (
              <span key={i} className="chip chip-tech">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Team Capacity Progress Bar */}
      <div className="capacity-section">
        <div className="capacity-header">
          <span><Users size={13} /> Team Capacity</span>
          <span className="capacity-numbers">
            {occupiedSeats} / {project.required_members || 3} Members
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${isRecruiting ? 'fill-recruiting' : 'fill-active'}`}
            style={{ width: `${capacityPct}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-footer">
        <div className="creator-info">
          By <span className="creator-name">{project.creator?.name || project.creator_name || 'Experienced Lead'}</span>
        </div>
        <div className="card-actions">
          {/* Details Button uses your exact .btn-secondary */}
          <button className="btn-secondary" onClick={() => onViewDetails(project)}>
            Details &gt;
          </button>

          {/* Dynamic Buttons using your .btn-join and .btn-joined classes */}
          {isCreator ? (
            <button className="btn-join" disabled>Creator</button>
          ) : project.joined === true ? (
  <button 
  className="btn-join btn-joined" 
  disabled={isPending}
  onClick={(e) => { 
    e.stopPropagation(); 
    onLeave(project.id); 
  }}
>
  {isPending ? 'Leaving...' : 'Leave Team'}
</button>
) : isFull ? (
            <button className="btn-join" disabled>Full</button>
          ) : (
            <button 
  className="btn-join" 
  disabled={isPending}
  onClick={(e) => { 
    e.stopPropagation(); 
    onJoin(project.id); 
  }}
>
  <span className="icon">+</span> {isPending ? 'Joining...' : 'Join Team'}
</button>
          )}
        </div>
      </div>
    </div>
  );
}