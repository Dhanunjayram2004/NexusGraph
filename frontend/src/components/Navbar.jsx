import React from 'react';
import { Network, Plus, User, Sparkles, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({
  activeUser,
  users,
  onSwitchUser,
  onOpenCreate,
  onOpenProfile,
  searchQuery,
  onSearchChange,
  activeTab,
  setActiveTab,
  backendConnected
}) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          <div className="brand" onClick={() => setActiveTab('explore')}>
            <div className="brand-icon">
              <Network size={22} />
            </div>
            <span className="brand-title">WEXA<span className="brand-sub">Projects</span></span>
          </div>

          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'explore' ? 'active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              Explore Feed
            </button>
            <button
              className={`nav-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <Sparkles size={15} />
              Graph Match
            </button>
          </div>
        </div>

        <div className="nav-center">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search skills, domains, YOLO, Verilog..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => onSearchChange('')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="nav-right">
          {/* Live CognoDB Connection status indicator */}
          <div className="status-pill" title={backendConnected ? "Connected to CognoDB" : "Backend Offline"}>
            {backendConnected ? (
              <span className="status-online"><CheckCircle2 size={13} /> Graph Live</span>
            ) : (
              <span className="status-offline"><AlertCircle size={13} /> Connecting</span>
            )}
          </div>

          {/* User Switcher (For testing graph match with different user profiles) */}
          <div className="user-selector-container">
            <select
              className="user-select"
              value={activeUser?.id || ''}
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) onSwitchUser(selected);
              }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.level || 'Fresher'})
                </option>
              ))}
            </select>
          </div>

          <button className="icon-btn" onClick={onOpenProfile} title="View Profile">
            <User size={18} />
          </button>

          <button className="btn-primary" onClick={onOpenCreate}>
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      </div>
    </header>
  );
}