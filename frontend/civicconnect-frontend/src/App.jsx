import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  LayoutDashboard,
  FilePlus,
  MapPin,
  ListFilter,
  ShieldAlert,
  Users,
  Info,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  Layers,
  Upload,
  Trash2,
  Edit3,
  Navigation,
  Building2,
  X,
  Menu,
  ShieldCheck,
  UserCheck,
  UserX,
  PieChart,
  BarChart3,
  FileText
} from 'lucide-react';
import Auth from './Auth.jsx';

const API_BASE = 'http://localhost:8085/api/issues';
const USER_API_BASE = 'http://localhost:8085/api/users';
const BACKEND_URL = 'http://localhost:8085';

// Leaflet Custom Color Icons
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  SUBMITTED: createIcon('orange'),
  IN_PROGRESS: createIcon('blue'),
  RESOLVED: createIcon('green'),
  REJECTED: createIcon('red')
};

// Map Click Geotagging Helper Component
function ClickToPin({ onPin }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPin(lat, lng);
    }
  });
  return null;
}

// Center Map Helper
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14);
    }
  }, [lat, lng, map]);
  return null;
}

export default function App() {
  // Session User State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civicUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Issues & Users Data State
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Form State for Report Issue
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Roads');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(16.4419);
  const [longitude, setLongitude] = useState(80.6226);
  const [address, setAddress] = useState('Vijayawada Central Municipal Ward');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Feed Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Edit Modal State
  const [editingIssue, setEditingIssue] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch all issues from backend
  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const response = await axios.get(`${API_BASE}/all`);
      setIssues(response.data || []);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // Fetch users for Admin User Management
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${USER_API_BASE}/all`);
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIssues();
      if (user.role === 'ADMIN') {
        fetchUsers();
      }
    }
  }, [user]);

  // Strict Logout Handler (Single Topbar Button)
  const handleLogout = () => {
    localStorage.removeItem('civicUser');
    setUser(null);
    setActiveTab('dashboard');
  };

  // Reverse Geocode via OpenStreetMap
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.data && res.data.display_name) {
        setAddress(res.data.display_name);
      } else {
        setAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`Municipal Zone (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  // Map Click Handler in Report Form
  const handleMapPin = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    reverseGeocode(lat, lng);
  };

  // Detect Current GPS Location
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          reverseGeocode(lat, lng);
        },
        (err) => {
          alert('Could not retrieve current location: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Image Upload Change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Create Issue Submit
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (!title || !description || !category) {
      setFormMsg({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('address', address);
    formData.append('userId', user.id);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await axios.post(`${API_BASE}/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormMsg({ type: 'success', text: 'Issue reported successfully!' });
      
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      
      fetchIssues();

      setTimeout(() => {
        setActiveTab('feed');
        setFormMsg({ type: '', text: '' });
      }, 1200);

    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data || 'Failed to submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status or Priority
  const handleUpdateIssue = async (id, updatePayload) => {
    try {
      await axios.put(`${API_BASE}/update/${id}`, updatePayload);
      fetchIssues();
    } catch (err) {
      alert('Failed to update issue: ' + (err.response?.data?.message || err.message));
    }
  };

  // Save Citizen Edit
  const handleSaveEdit = async () => {
    if (!editingIssue) return;
    await handleUpdateIssue(editingIssue.id, {
      title: editTitle,
      description: editDescription
    });
    setEditingIssue(null);
  };

  // Delete Issue Ticket
  const handleDeleteIssue = async (id) => {
    if (!window.confirm('Are you sure you want to delete/purge this report ticket?')) return;

    try {
      await axios.delete(`${API_BASE}/delete/${id}`);
      fetchIssues();
    } catch (err) {
      alert('Failed to delete issue: ' + (err.response?.data?.message || err.message));
    }
  };

  // Admin User Role Toggle
  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
    try {
      await axios.put(`${USER_API_BASE}/update-role/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user role: ' + (err.response?.data?.message || err.message));
    }
  };

  // Admin Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user account?')) return;
    try {
      await axios.delete(`${USER_API_BASE}/delete/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered Issues for Feed
  const filteredIssues = issues.filter((iss) => {
    const matchesSearch =
      iss.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iss.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (iss.address && iss.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = filterCategory === 'ALL' || iss.category === filterCategory;
    const matchesStat = filterStatus === 'ALL' || iss.status === filterStatus;

    return matchesSearch && matchesCat && matchesStat;
  });

  // Calculate Metrics
  const totalCount = issues.length;
  const pendingCount = issues.filter((i) => i.status === 'SUBMITTED' || i.status === 'IN_PROGRESS').length;
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED').length;
  const rejectedCount = issues.filter((i) => i.status === 'REJECTED').length;
  const geotaggedCount = issues.filter((i) => i.latitude && i.longitude).length;

  // Citizen Specific Metrics
  const myIssues = issues.filter((i) => i.user && i.user.id === user.id);
  const myTotalCount = myIssues.length;
  const myPendingCount = myIssues.filter((i) => i.status === 'SUBMITTED' || i.status === 'IN_PROGRESS').length;
  const myResolvedCount = myIssues.filter((i) => i.status === 'RESOLVED').length;

  const categories = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Public Safety'];
  const getCategoryCount = (cat) => issues.filter((i) => i.category === cat).length;

  if (!user) {
    return <Auth onLoginSuccess={setUser} />;
  }

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION (NO LOGOUT AT BOTTOM) */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">
            <Building2 size={22} />
          </div>
          <div>
            <div className="sidebar-brand-title">CivicConnect</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Municipal GIS Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Portal</div>

          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>{user.role === 'ADMIN' ? 'Admin Executive Portal' : 'Citizen Dashboard'}</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => { setActiveTab('report'); setMobileMenuOpen(false); }}
          >
            <FilePlus size={18} />
            <span>Report Civic Issue</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => { setActiveTab('map'); setMobileMenuOpen(false); }}
          >
            <MapPin size={18} />
            <span>Interactive GIS Map</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }}
          >
            <ListFilter size={18} />
            <span>All Reports Feed</span>
          </div>

          {/* ADMIN SPECIAL SECTION */}
          {user.role === 'ADMIN' && (
            <>
              <div className="sidebar-section-label">Governance & Triage</div>
              <div
                className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
              >
                <ShieldAlert size={18} />
                <span>Admin Governance</span>
              </div>
              <div
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
              >
                <Users size={18} />
                <span>User Management</span>
              </div>
            </>
          )}

          <div className="sidebar-section-label">System</div>
          <div
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => { setActiveTab('about'); setMobileMenuOpen(false); }}
          >
            <Info size={18} />
            <span>About Platform</span>
          </div>
        </nav>

        {/* LOGGED IN USER FOOTER (USER DISPLAY ONLY - NO LOGOUT BUTTON HERE) */}
        <div className="sidebar-user-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className={`user-role-chip ${user.role === 'ADMIN' ? 'role-admin' : 'role-citizen'}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="main-wrapper">
        {/* TOPBAR WITH SINGLE EXPLICIT LOGOUT BUTTON */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={22} />
            </button>
            <div className="topbar-title-group">
              <h1>
                {activeTab === 'dashboard' && (user.role === 'ADMIN' ? 'Municipal Admin Executive Dashboard' : 'Citizen Grievance Dashboard')}
                {activeTab === 'report' && 'Submit Civic Grievance Ticket'}
                {activeTab === 'map' && 'City GIS Geotagged Tracking Map'}
                {activeTab === 'feed' && 'Civic Reports & Resolution Feed'}
                {activeTab === 'admin' && 'Admin Lifecycle Triage Portal'}
                {activeTab === 'users' && 'Administrator User Directory'}
                {activeTab === 'about' && 'CivicConnect Architecture & Purpose'}
              </h1>
              <p>Municipal Corporation Public Service & Grievance Governance</p>
            </div>
          </div>

          <div className="topbar-actions">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Logged in as <strong style={{ color: 'var(--primary-navy)' }}>{user.email}</strong>
            </span>
            {/* SINGLE TOP-RIGHT LOGOUT BUTTON */}
            <button className="btn-topbar-logout" onClick={handleLogout} title="Sign Out of Portal">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* CONTENT BODY */}
        <main className="content-body">

          {/* ==================== 1. DEDICATED ROLE DASHBOARDS ==================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* ROLE A: CITIZEN SPECIFIC DASHBOARD */}
              {user.role === 'CITIZEN' && (
                <div>
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#3b82f6' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{myTotalCount}</div>
                        <div className="kpi-label">My Reports Filed</div>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#f59e0b' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{myPendingCount}</div>
                        <div className="kpi-label">My Active Tickets</div>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#10b981' }}>
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{myResolvedCount}</div>
                        <div className="kpi-label">My Issues Resolved</div>
                      </div>
                    </div>

                    <div className="kpi-card" style={{ background: '#f0f7ff', border: '1.5px solid #bae6fd' }}>
                      <button
                        onClick={() => setActiveTab('report')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <div className="kpi-icon-box" style={{ background: 'var(--primary-blue)' }}>
                          <FilePlus size={24} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-navy)' }}>Report New Issue</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to geotag GIS pin</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="analytics-grid">
                    <div className="panel-card">
                      <div className="panel-header">
                        <h3>My Submitted Grievances Feed</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{myIssues.length} Total</span>
                      </div>
                      {myIssues.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You have not reported any civic issues yet.</p>
                          <button className="btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => setActiveTab('report')}>
                            Report Your First Issue
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {myIssues.map((iss) => (
                            <div
                              key={iss.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 14px',
                                background: '#f8fafc',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{iss.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Category: {iss.category} &bull; 📍 {iss.address ? iss.address.substring(0, 30) + '...' : 'Location Geotagged'}
                                </div>
                              </div>
                              <span className={`badge badge-${iss.status.toLowerCase().replace('_', '-')}`}>
                                {iss.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="panel-card">
                      <div className="panel-header">
                        <h3>City Category Distribution</h3>
                      </div>
                      <div className="progress-list">
                        {categories.map((cat) => {
                          const count = getCategoryCount(cat);
                          const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                          return (
                            <div key={cat} className="progress-item">
                              <div className="progress-info">
                                <span>{cat}</span>
                                <span>{count} tickets ({pct}%)</span>
                              </div>
                              <div className="progress-bar-bg">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${pct}%`, background: 'var(--primary-blue)' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ROLE B: ADMIN EXECUTIVE GOVERNANCE DASHBOARD */}
              {user.role === 'ADMIN' && (
                <div>
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#3b82f6' }}>
                        <Layers size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{totalCount}</div>
                        <div className="kpi-label">City-Wide Tickets</div>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#f59e0b' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{pendingCount}</div>
                        <div className="kpi-label">Triage Pending Queue</div>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#10b981' }}>
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{resolvedCount}</div>
                        <div className="kpi-label">Resolved Issues</div>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box" style={{ background: '#8b5cf6' }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="kpi-val">{users.length || 1}</div>
                        <div className="kpi-label">Registered Users</div>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-grid">
                    <div className="panel-card">
                      <div className="panel-header">
                        <h3><PieChart size={18} style={{ display: 'inline', marginRight: '6px' }} /> Municipal Status Breakdown</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem' }}>
                        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>SUBMITTED</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400e' }}>
                            {issues.filter(i => i.status === 'SUBMITTED').length}
                          </div>
                        </div>
                        <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8' }}>IN PROGRESS</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e40af' }}>
                            {issues.filter(i => i.status === 'IN_PROGRESS').length}
                          </div>
                        </div>
                        <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>RESOLVED</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>{resolvedCount}</div>
                        </div>
                        <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>REJECTED</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991b1b' }}>{rejectedCount}</div>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>High Priority Alerts</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {issues.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL').length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No critical priority tickets pending.</p>
                        ) : (
                          issues.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL').map((iss) => (
                            <div
                              key={iss.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: '#fff7ed',
                                borderRadius: '8px',
                                border: '1px solid #fed7aa'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c2410c' }}>{iss.title}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Category: {iss.category} &bull; Priority: {iss.priority}
                                </div>
                              </div>
                              <span className={`badge badge-${iss.priority.toLowerCase()}`}>
                                {iss.priority}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="panel-card">
                      <div className="panel-header">
                        <h3><BarChart3 size={18} style={{ display: 'inline', marginRight: '6px' }} /> Category Wise Ticket Volume</h3>
                      </div>
                      <div className="progress-list">
                        {categories.map((cat) => {
                          const count = getCategoryCount(cat);
                          const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                          return (
                            <div key={cat} className="progress-item">
                              <div className="progress-info">
                                <span>{cat}</span>
                                <span>{count} tickets ({pct}%)</span>
                              </div>
                              <div className="progress-bar-bg">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${pct}%`, background: 'var(--primary-blue)' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 2. REPORT ISSUE ==================== */}
          {activeTab === 'report' && (
            <div className="form-card">
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>Report a Municipal Problem</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Click anywhere on the interactive GIS map to pinpoint the exact geotag location.
                </p>
              </div>

              {formMsg.text && (
                <div className={`auth-alert ${formMsg.type === 'error' ? 'auth-alert-error' : 'auth-alert-success'}`}>
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateIssue}>
                <div className="form-grid">
                  <div>
                    <div className="form-group">
                      <label>Issue Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Severe Pothole on Main Road"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Detailed Description *</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Provide details regarding the hazard, landmark, or public inconvenience..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Attach Proof Photo</label>
                      <label className="file-upload-box">
                        <Upload size={24} style={{ color: 'var(--primary-blue)', marginBottom: '4px' }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {imageFile ? imageFile.name : 'Click or Drag photo here'}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="img-preview" />
                      )}
                    </div>
                  </div>

                  {/* GIS MAP CLICK-TO-PIN PICKER */}
                  <div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Location Geotagging (GIS Map Click-to-Pin)</label>
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          style={{
                            background: '#e0f2fe',
                            color: '#0284c7',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Navigation size={12} />
                          <span>Detect GPS</span>
                        </button>
                      </div>

                      <div className="map-picker-container">
                        <MapContainer
                          center={[latitude, longitude]}
                          zoom={13}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[latitude, longitude]} icon={icons.SUBMITTED} />
                          <ClickToPin onPin={handleMapPin} />
                          <RecenterMap lat={latitude} lng={longitude} />
                        </MapContainer>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label>Latitude</label>
                        <input type="text" className="form-control" value={latitude} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Longitude</label>
                        <input type="text" className="form-control" value={longitude} readOnly />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Resolved Address / Landmark</label>
                      <input
                        type="text"
                        className="form-control"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                  <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.8rem 2.5rem' }} disabled={submitting}>
                    {submitting ? 'Submitting Report...' : 'Submit Report Ticket'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 3. INTERACTIVE ISSUE MAP (GIS) ==================== */}
          {activeTab === 'map' && (
            <div className="full-map-container">
              <MapContainer
                center={[16.4419, 80.6226]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {issues.map((iss) => {
                  if (!iss.latitude || !iss.longitude) return null;
                  const markerIcon = icons[iss.status] || icons.SUBMITTED;
                  return (
                    <Marker key={iss.id} position={[iss.latitude, iss.longitude]} icon={markerIcon}>
                      <Popup>
                        <div className="popup-content">
                          {iss.imageUrl && (
                            <img
                              src={`${BACKEND_URL}${iss.imageUrl}`}
                              alt={iss.title}
                              className="popup-img"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="popup-title">{iss.title}</div>
                          <div style={{ margin: '4px 0' }}>
                            <span className={`badge badge-${iss.status.toLowerCase().replace('_', '-')}`}>
                              {iss.status}
                            </span>
                            <span className={`badge badge-${iss.priority.toLowerCase()}`} style={{ marginLeft: '4px' }}>
                              {iss.priority}
                            </span>
                          </div>
                          <div className="popup-desc">{iss.description}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            📍 {iss.address || `${iss.latitude}, ${iss.longitude}`}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* ==================== 4. ALL REPORTS FEED ==================== */}
          {activeTab === 'feed' && (
            <div>
              {/* FEED FILTERS */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Search by title, description, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div style={{ minWidth: '160px' }}>
                  <select
                    className="form-control"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '160px' }}>
                  <select
                    className="form-control"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* TABLE OF REPORTS */}
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Proof Photo</th>
                      <th>Issue Details</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No matching report tickets found.
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((iss) => (
                        <tr key={iss.id}>
                          <td><strong>#TCK-{iss.id}</strong></td>
                          <td>
                            {iss.imageUrl ? (
                              <img
                                src={`${BACKEND_URL}${iss.imageUrl}`}
                                alt="Proof"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No Image</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{iss.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{iss.description}</div>
                            <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px' }}>
                              📍 {iss.address || 'Geotagged'}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{iss.category}</span>
                          </td>
                          <td>
                            <span className={`badge badge-${iss.status.toLowerCase().replace('_', '-')}`}>
                              {iss.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${iss.priority.toLowerCase()}`}>
                              {iss.priority}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {(user.role === 'ADMIN' || (iss.user && iss.user.id === user.id)) && (
                                <>
                                  <button
                                    className="action-btn btn-edit"
                                    onClick={() => {
                                      setEditingIssue(iss);
                                      setEditTitle(iss.title);
                                      setEditDescription(iss.description);
                                    }}
                                  >
                                    <Edit3 size={14} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    className="action-btn btn-delete"
                                    onClick={() => handleDeleteIssue(iss.id)}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 5. ADMIN TRIAGE PORTAL (ADMIN SPECIAL) ==================== */}
          {activeTab === 'admin' && user.role === 'ADMIN' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem' }}>Municipal Triage Governance</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage city-wide issue lifecycle status, update priority urgency, or purge invalid tickets.
                </p>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Reporter</th>
                      <th>Issue & Location</th>
                      <th>Category</th>
                      <th>Status (Direct Triage)</th>
                      <th>Priority Assignment</th>
                      <th>Purge Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No issues found in system.</td>
                      </tr>
                    ) : (
                      issues.map((iss) => (
                        <tr key={iss.id}>
                          <td><strong>#TCK-{iss.id}</strong></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{iss.user ? iss.user.name : 'Citizen'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{iss.user ? iss.user.email : ''}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{iss.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>📍 {iss.address}</div>
                          </td>
                          <td>{iss.category}</td>
                          <td>
                            <select
                              className="table-select"
                              value={iss.status}
                              onChange={(e) => handleUpdateIssue(iss.id, { status: e.target.value })}
                            >
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="RESOLVED">RESOLVED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="table-select"
                              value={iss.priority}
                              onChange={(e) => handleUpdateIssue(iss.id, { priority: e.target.value })}
                            >
                              <option value="LOW">LOW</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="HIGH">HIGH</option>
                              <option value="CRITICAL">CRITICAL</option>
                            </select>
                          </td>
                          <td>
                            <button className="action-btn btn-delete" onClick={() => handleDeleteIssue(iss.id)}>
                              <Trash2 size={14} />
                              <span>Purge Ticket</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 6. USER MANAGEMENT (ADMIN SPECIAL) ==================== */}
          {activeTab === 'users' && user.role === 'ADMIN' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem' }}>User Directory & Authorization Management</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage registered citizens and promote or modify administrator permissions across the portal.
                </p>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Legal Name</th>
                      <th>Email Address</th>
                      <th>Role Authorization</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No users loaded.</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td><strong>#USR-{u.id}</strong></td>
                          <td><div style={{ fontWeight: 700 }}>{u.name}</div></td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`user-role-chip ${u.role === 'ADMIN' ? 'role-admin' : 'role-citizen'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="action-btn btn-edit"
                                onClick={() => handleToggleUserRole(u.id, u.role)}
                              >
                                {u.role === 'ADMIN' ? <UserX size={14} /> : <UserCheck size={14} />}
                                <span>{u.role === 'ADMIN' ? 'Demote to Citizen' : 'Promote to Admin'}</span>
                              </button>
                              <button
                                className="action-btn btn-delete"
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <Trash2 size={14} />
                                <span>Remove User</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 7. ABOUT PROJECT ==================== */}
          {activeTab === 'about' && (
            <div className="panel-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Building2 size={48} style={{ color: 'var(--primary-blue)', marginBottom: '12px' }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem' }}>CivicConnect Municipal Corporation</h2>
                <p style={{ color: 'var(--text-muted)' }}>Integrated Public Grievance & GIS Governance Platform</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
                <p>
                  <strong>CivicConnect</strong> is an enterprise civic engagement platform designed for municipal corporations 
                  to bridge the gap between citizens and administration. It empowers residents to report infrastructural, sanitation, 
                  and environmental issues directly with precise GIS geotagging and photo evidence.
                </p>

                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: '8px', color: 'var(--primary-navy)' }}>
                    Core Technology Stack
                  </h4>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li><strong>Backend Architecture</strong>: Java 17, Spring Boot 3, Spring Security, BCrypt Authentication</li>
                    <li><strong>Database</strong>: PostgreSQL 15 RDBMS (`civicconnect`)</li>
                    <li><strong>Frontend Framework</strong>: React 18, Vite, Axios, Lucide React</li>
                    <li><strong>Geospatial Engine</strong>: Leaflet GIS Map Engine, OpenStreetMap Tile Services</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* EDIT ISSUE MODAL OVERLAY */}
      {editingIssue && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Edit Report Ticket #{editingIssue.id}</h3>
              <button className="btn-close" onClick={() => setEditingIssue(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="form-control"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="4"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="form-control"
                style={{ width: 'auto', cursor: 'pointer' }}
                onClick={() => setEditingIssue(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                onClick={handleSaveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
