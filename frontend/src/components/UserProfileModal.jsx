import React, { useEffect, useState } from 'react';
import { X, Award, Code, Compass, FolderCheck, PlusCircle } from 'lucide-react';
import { api } from '../api/config';

export default function UserProfileModal({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user?.id) {
      api.getUser(user.id)
        .then(data => {
          if (active) {
            setProfile(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    }
    return () => { active = false; };
  }, [user]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-profile" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="profile-header">
          <div className="profile-avatar-large">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="profile-name">{user?.name}</h2>
            <div className="profile-badge">
              <Award size={14} /> {profile?.level || user?.level || 'Fresher Level 1'}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading graph profile...</div>
        ) : (
          <div className="profile-body">
            <div className="profile-section">
              <h4><Code size={15} /> Verified Graph Skills</h4>
              <div className="chips">
                {(profile?.skills || user?.skills || []).map((s, i) => (
                  <span key={i} className="chip chip-skill">{s}</span>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h4><Compass size={15} /> Domains of Interest</h4>
              <div className="chips">
                {(profile?.domains || ['Computer Vision', 'Machine Learning']).map((d, i) => (
                  <span key={i} className="chip chip-tech">{d}</span>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h4><FolderCheck size={15} /> Joined Teams ({profile?.joined_projects?.length || 0})</h4>
              {profile?.joined_projects?.length > 0 ? (
                <div className="profile-project-list">
                  {profile.joined_projects.map(p => (
                    <div key={p.id} className="profile-proj-item">
                      <span>{p.title}</span>
                      <span className="status-pill-mini">{p.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="subtext">Has not joined any project teams yet.</p>
              )}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
}