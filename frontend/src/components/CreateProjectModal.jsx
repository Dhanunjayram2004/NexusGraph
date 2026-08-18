import React, { useState } from 'react';
import { X, Plus, Rocket } from 'lucide-react';
import { api } from '../api/config';

export default function CreateProjectModal({ onClose, onCreated, activeUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Computer Vision');
  const [skills, setSkills] = useState('Python, Machine Learning');
  const [technologies, setTechnologies] = useState('PyTorch, OpenCV');
  const [requiredMembers, setRequiredMembers] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      title,
      description,
      domain,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      technologies: technologies.split(',').map(t => t.trim()).filter(Boolean),
      required_members: parseInt(requiredMembers, 10) || 3,
      creator_id: activeUser?.id || 'user_1'
    };

    try {
      const res = await api.createProject(payload);
      onCreated(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project in graph');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-form" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="modal-header">
          <span className="domain-badge"><Rocket size={14} /> Graph Project Creator</span>
        </div>

        <h2 className="modal-title">Initiate New Project</h2>
        <p className="modal-description">
          Add a project node to CognoDB and connect required skills, tech stack, and domain nodes.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label>Project Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Neural Compiler"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Domain</label>
            <select value={domain} onChange={e => setDomain(e.target.value)}>
              <option value="Computer Vision">Computer Vision</option>
              <option value="Game Development">Game Development</option>
              <option value="VLSI">VLSI</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Distributed Systems">Distributed Systems</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="3"
              required
              placeholder="Explain the problem statement and learning outcomes for freshers..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Required Skills (comma separated)</label>
              <input
                type="text"
                placeholder="Python, C++, Verilog"
                value={skills}
                onChange={e => setSkills(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Technologies / Tools</label>
              <input
                type="text"
                placeholder="Unity, PyTorch, React"
                value={technologies}
                onChange={e => setTechnologies(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Team Capacity (Required Members)</label>
            <input
              type="number"
              min="2"
              max="10"
              value={requiredMembers}
              onChange={e => setRequiredMembers(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating in Graph...' : <><Plus size={16} /> Publish Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}