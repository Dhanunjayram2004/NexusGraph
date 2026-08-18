import React, { useEffect, useState } from 'react';
import { X, Users, Code, Cpu, CheckCircle2, UserPlus, Layers, ShieldCheck, Check } from 'lucide-react';
import { api } from '../api/config';

export default function ProjectDetailModal({ project, onClose, onJoin, onLeave, currentUserId, isJoined }) {
  const [details, setDetails] = useState(project);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getProject(project.id, currentUserId)
      .then((data) => {
        if (mounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [project.id, currentUserId]);

  // Whenever the parent re-fetches this project (e.g. right after a join/leave call
  // resolves), sync that authoritative data in immediately instead of waiting for a
  // fresh mount — this is what was making the modal look stuck on stale data before.
  useEffect(() => {
    setDetails(prev => ({ ...prev, ...project }));
  }, [project]);

// 1. Check for both creator object AND creator_id from backend
  const isCreator = currentUserId && (
    String(details.creator?.id) === String(currentUserId) || 
    String(details.creator_id) === String(currentUserId)
  );

  // 2. Bulletproof joined check: check if user exists in the members array
  const isMember = details.members?.some(m => String(m.id) === String(currentUserId));
  const effectiveJoined = details.joined || isJoined || isMember;

  // 3. Fix capacity overflow (cap at max required)
  const creatorExists = details.creator || details.creator_id;
  const rawSeats = (details.current_members || 0) + (creatorExists ? 1 : 0);
  const required = details.required_members || 3;
  const occupiedSeats = Math.min(rawSeats, required); 
  
  const isFull = rawSeats >= required;
  const isRecruiting = details.status === 'Recruiting';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="domain-badge">{details.domain || 'Engineering'}</div>
          <span className={`status-badge ${isRecruiting ? 'badge-recruiting' : 'badge-active'}`}>
            <span className="status-dot"></span>
            {details.status}
          </span>
        </div>

        <h2 className="modal-title">{details.title}</h2>
        <p className="modal-description">{details.description}</p>

        {/* Graph Meta Breakdown */}
        <div className="details-grid">
          <div className="detail-pane">
            <h4><Code size={15} /> Required Skills</h4>
            <div className="chips">
              {(details.skills || []).map((s, i) => (
                <span key={i} className="chip chip-skill">{s}</span>
              ))}
            </div>
          </div>

          <div className="detail-pane">
            <h4><Cpu size={15} /> Technologies & Stack</h4>
            <div className="chips">
              {(details.technologies || []).map((t, i) => (
                <span key={i} className="chip chip-tech">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="team-section">
          <div className="team-section-header">
            <h4><Users size={16} /> Team Members ({occupiedSeats} / {details.required_members || 3})</h4>
            <span className="team-status-text">
              {isFull ? 'Team is full and Active' : `Needs ${(details.required_members || 3) - occupiedSeats} more fresher(s)`}
            </span>
          </div>

          <div className="members-grid">
            {/* Creator Node */}
            <div className="member-card creator-member">
              <div className="member-avatar">
                <ShieldCheck size={18} />
              </div>
              <div className="member-meta">
                <span className="member-name">{details.creator?.name || 'Project Creator'}</span>
                <span className="member-role">Creator / Mentor</span>
              </div>
            </div>

            {/* Joined Members */}
            {(details.members || []).map((m) => (
              <div key={m.id} className="member-card">
                <div className="member-avatar">{m.name?.charAt(0) || 'U'}</div>
                <div className="member-meta">
                  <span className="member-name">{m.name}</span>
                  <span className="member-role">{m.level || 'Fresher'}</span>
                </div>
              </div>
            ))}

            {/* Open Slots */}
            {Array.from({ length: Math.max(0, (details.required_members || 3) - occupiedSeats) }).map((_, i) => (
              <div key={i} className="member-card slot-empty">
                <div className="member-avatar slot-avatar">+</div>
                <div className="member-meta">
                  <span className="member-name">Open Seat</span>
                  <span className="member-role">Awaiting Fresher</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Tasks */}
        {details.tasks && details.tasks.length > 0 && (
          <div className="tasks-section">
            <h4><Layers size={15} /> Project Milestones & Tasks</h4>
            <div className="task-list">
              {details.tasks.map((t) => (
                <div key={t.id} className="task-item">
                  <CheckCircle2 size={16} className="task-check" />
                  <span>{t.title}</span>
                  <span className="task-pill">{t.status || 'Planned'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer / Join Button */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {effectiveJoined && !isCreator ? (
            <button
              className="btn-primary btn-leave"
              onClick={() => onLeave(details.id)}
            >
              Leave Team
            </button>
          ) : (
            <button
              className={`btn-primary btn-modal-join ${effectiveJoined ? 'btn-joined' : ''}`}
              disabled={effectiveJoined || isFull}
              onClick={() => onJoin(details.id)}
            >
              {effectiveJoined ? (
                <><Check size={16} /> Joined Team</>
              ) : isFull ? (
                'Team Full'
              ) : (
                <><UserPlus size={16} /> Join Project ({Math.max(0, (details.required_members || 3) - occupiedSeats)} spots left)</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}