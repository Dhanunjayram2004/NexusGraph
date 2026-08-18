import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProjectCard from './components/ProjectCard';
import ProjectDetailModal from './components/ProjectDetailModal';
import GraphMatchSection from './components/GraphMatchSection';
import CreateProjectModal from './components/CreateProjectModal';
import UserProfileModal from './components/UserProfileModal';
import { api } from './api/config';
import { Sparkles, Layers, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import './App.css';
import { createFormation } from "@dynt/formation";
import "@dynt/formation/styles.css";
export default function App() {
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [users, setUsers] = useState([
    { id: 'user_1', name: 'Dhanunjay Ram', level: 'Fresher Level 1', skills: ['Python', 'Machine Learning'] },
    { id: 'user_2', name: 'Aarav Patel', level: 'Fresher Level 2', skills: ['React', 'Game Development'] },
    { id: 'user_3', name: 'Ananya Sharma', level: 'Lead Engineer', skills: ['Verilog', 'Digital Design'] }
  ]);
  const [activeUser, setActiveUser] = useState(users[0]);
  const [activeDomain, setActiveDomain] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('explore');// 'explore' | 'recommendations'
  const [pendingJoins, setPendingJoins] = useState(new Set());
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  // Modals & UI state
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const sortProjectsByQuery = (items, query, domain) => {
    const normalizedQuery = (query || '').trim().toLowerCase();
    const normalizedDomain = (domain || '').trim().toLowerCase();

    return [...items].sort((a, b) => {
      const score = (project) => {
        const text = [
          project.title,
          project.description,
          project.domain,
          ...(project.skills || []),
          ...(project.technologies || [])
        ].join(' ').toLowerCase();

        let s = 0;

        if (normalizedDomain && project.domain && project.domain.toLowerCase() === normalizedDomain) s += 200;
        if (normalizedDomain && project.domain && project.domain.toLowerCase().includes(normalizedDomain)) s += 120;

        if (normalizedQuery) {
          if (text.includes(normalizedQuery)) s += 100;
          if (project.title && project.title.toLowerCase().includes(normalizedQuery)) s += 40;
          if (project.domain && project.domain.toLowerCase().includes(normalizedQuery)) s += 25;
          if ((project.skills || []).some(skill => skill.toLowerCase().includes(normalizedQuery))) s += 25;
          if ((project.technologies || []).some(tech => tech.toLowerCase().includes(normalizedQuery))) s += 25;
        }

        if (project.status === 'Recruiting') s += 10;
        if ((project.current_members || 0) < (project.required_members || 3)) s += 5;

        return s;
      };

      return score(b) - score(a);
    });
  };

  // Fetch users from backend or fallback to initial
  const loadUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
        setActiveUser(data[0]);
      }
    } catch (e) {
      // Keep fallback users
    }
  }, []);

  // Fetch projects from backend
// Fetch projects from backend
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      // We are now using debouncedQuery instead of searchQuery here!
      if (debouncedQuery.trim()) {
        data = await api.search(
          debouncedQuery.trim(),
          activeUser?.id,
          activeDomain
        );
      } else {
        data = await api.getProjects(activeDomain, null, activeUser?.id);
      }

      const ordered = sortProjectsByQuery(data || [], debouncedQuery, activeDomain);
      setProjects(ordered);
      setBackendConnected(true);
    } catch (err) {
      console.error(err);
      setBackendConnected(false);
      showToast("Unable to reach CognoDB backend. Using local graph state.", "error");
    } finally {
      setLoading(false);
    }
  }, [activeDomain, debouncedQuery, activeUser?.id]); // Updated dependency here too!

  // Fetch recommendations for active user
  const loadRecommendations = useCallback(async () => {
    if (!activeUser?.id) return;
    try {
      const data = await api.getRecommendations(activeUser.id);
      setRecommendations(data || []);
    } catch (err) {
      console.error("Recommendations error:", err);
    }
  }, [activeUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);
  useEffect(() => {
    // Initialize the line-led formation over WEXA's elements
    const formation = createFormation({
      root: document,
      // Target your specific WEXA UI components
      selector: ".project-card, .btn-primary, .modal-content, .match-card",
      profile: "line-push", // Constructs horizontal edges before vertical
      observe: true, // Automatically applies to dynamically loaded projects
      viewportFlow: true, // Adds the travelling-line choreography on load
      tokens: {
        duration: 320,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        // THIS is where we inject the n8n aesthetic:
        fillColor: "#242933", // n8n dark surface color
        lineColor: "#FF5A5F", // n8n vibrant neon coral line
        lineStyle: "solid",
        lineWidth: "1px",
      }
    });

    // Cleanup when the component unmounts
    return () => {
      formation.destroy();
    };
  }, []);

  // Handle Joining a Project
const handleJoinProject = async (projectId) => {
  if (!activeUser?.id) {
    console.error("No active user ID");
    return;
  }
  if (pendingJoins.has(projectId)) return;
  setPendingJoins(prev => new Set(prev).add(projectId));
  console.log("JOINING PROJECT:", projectId);
  console.log("USER ID:", activeUser.id);

  try {
    const res = await api.joinProject(projectId, activeUser.id);

    console.log("JOIN API RESPONSE:", res);

    const nextJoined = res.already_joined === true || res.message?.toLowerCase().includes('already') || res.message?.toLowerCase().includes('joined');

    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              joined: true,
              current_members: res.current_members ?? p.current_members,
              status: res.status ?? p.status,
            }
          : p
      )
    );

    setSelectedProject(prev =>
      prev && prev.id === projectId
        ? {
            ...prev,
            joined: true,
            current_members: res.current_members ?? prev.current_members,
            status: res.status ?? prev.status,
            members: prev.members || [],
          }
        : prev
    );

    if (nextJoined) {
      showToast("You are already in this project", "error");
    } else {
      showToast(res.message || "Successfully joined project team!", "success");
    }

    await refreshSingleProject(projectId);
    await loadRecommendations();
  } catch (err) {
    console.error("JOIN ERROR:", err);

    showToast(
      err.message || "Could not join project",
      "error"
    );

    await refreshSingleProject(projectId);
  }
finally {
    setPendingJoins(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  }
};;
  // Handle Leaving a Project
// Handle Leaving a Project
  const handleLeaveProject = async (projectId) => {
    if (!activeUser?.id) return;
    if (pendingJoins.has(projectId)) return;
    setPendingJoins(prev => new Set(prev).add(projectId));

    // OPTIMISTIC UPDATE: Instantly remove joined status
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, joined: false } : p)));
    setSelectedProject(prev => (prev && prev.id === projectId ? { ...prev, joined: false } : prev));

   try {
      const res = await api.leaveProject(projectId, activeUser.id);

      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, current_members: res.current_members ?? p.current_members, status: res.status ?? p.status }
            : p
        )
      );
      setSelectedProject(prev =>
        prev && prev.id === projectId
          ? { ...prev, current_members: res.current_members ?? prev.current_members, status: res.status ?? prev.status }
          : prev
      );

      showToast(res.message || "You left the project team.", "success");
      await refreshSingleProject(projectId);
      loadRecommendations();
    } catch (err) {
      showToast(err.message || "Could not leave project", "error");
      await refreshSingleProject(projectId);
    }
  finally {
    setPendingJoins(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  }
};

  // Re-fetch a single project from the backend (source of truth) and patch it
  // into both the list and the open modal, instead of hand-rolling the math client-side.
  const refreshSingleProject = async (projectId) => {
    try {
      const updated = await api.getProject(projectId, activeUser?.id);
      setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...updated } : p)));
      setSelectedProject(prev => (prev && prev.id === projectId ? { ...prev, ...updated } : prev));
    } catch (err) {
      console.error("Could not refresh project after join/leave:", err);
    }
  };

  const handleProjectCreated = (newProj) => {
    showToast(`Project "${newProj.title}" created in graph!`, "success");
    loadProjects();
    loadRecommendations();
  };

  const recruitingCount = projects.filter(p => p.status === 'Recruiting').length;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeUser={activeUser}
        users={users}
        onSwitchUser={(user) => {
          setActiveUser(user);
          console.log("Switched to user ID:", user.id);
          showToast(`Switched active graph identity to ${user.name}`);
        }}
        onOpenCreate={() => setShowCreateModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConnected={backendConnected}
      />

      {/* Hero Banner */}
      <Hero
        projectsCount={projects.length}
        recruitingCount={recruitingCount}
        activeDomain={activeDomain}
        onSelectDomain={setActiveDomain}
      />

      {/* Main Feed Container */}
      <main className="main-content">
        <div className="section-header">
          <div className="section-title-wrap">
            <h2>
              {activeTab === 'explore' ? (
                <><Layers size={20} /> Open Collaboration Feed</>
              ) : (
                <><Sparkles size={20} /> Graph Recommendations</>
              )}
            </h2>
            <span className="section-subtitle">
              {activeTab === 'explore'
                ? `Showing ${projects.length} projects matching filter criteria`
                : `Matched against ${activeUser?.name}'s skills and domain interests`}
            </span>
          </div>

          <button className="btn-refresh" onClick={() => { loadProjects(); loadRecommendations(); }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="card-grid">
            {[1, 2, 3].map(n => (
              <div key={n} className="project-card skeleton-card">
                <div className="skeleton-bar title-bar"></div>
                <div className="skeleton-bar desc-bar"></div>
                <div className="skeleton-bar tag-bar"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'recommendations' ? (
          <GraphMatchSection
            recommendations={recommendations}
            activeUser={activeUser}
            onSelectProject={(p) => setSelectedProject(p)}
          />
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <Layers size={42} className="empty-icon" />
            <h3>No projects found</h3>
            <p>Try searching for a different skill or reset domain filters.</p>
          </div>
        ) : (
          <div className="card-grid">
{projects.map(proj => (
          <ProjectCard
  key={proj.id}
  project={proj}
  onViewDetails={(p) => setSelectedProject(p)}
  onJoin={handleJoinProject}
  onLeave={handleLeaveProject}
  currentUserId={activeUser?.id}
  isFull={((proj.current_members || 0) + (proj.creator ? 1 : 0)) >= (proj.required_members || 3)}
  isPending={pendingJoins.has(proj.id)}
/>
        ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onJoin={handleJoinProject}
          onLeave={handleLeaveProject}
          currentUserId={activeUser?.id}
          isJoined={selectedProject.joined}
        />
      )}

      {showCreateModal && (
        <CreateProjectModal
          activeUser={activeUser}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          user={activeUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}