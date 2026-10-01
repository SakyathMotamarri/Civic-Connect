import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle, ShieldAlert, Globe } from 'lucide-react';

const API_BASE = 'http://localhost:8085/api/auth';

export default function Auth({ onLoginSuccess }) {
  // Views: 'login' | 'register_citizen' | 'register_admin' | 'forgot'
  const [view, setView] = useState('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('CIVIC-ADMIN-2026');

  // Forgot / Reset Password States
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenSent, setTokenSent] = useState(false);

  // Status Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Alphanumeric Password Validation: At least 6 chars, containing both letters and numbers
  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,}$/;
    return regex.test(pass);
  };

  // Login Submit Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email: email.trim(),
        password: password
      });

      const user = response.data;
      setSuccessMsg('Authentication successful! Redirecting to portal...');
      
      localStorage.setItem('civicUser', JSON.stringify(user));
      
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);

    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Registration Handler (Citizen or Admin)
  const handleRegister = async (e, targetRole) => {
    e.preventDefault();
    clearMessages();

    if (!name || !email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    // Enforce Alphanumeric Password Validation
    if (!validatePassword(password)) {
      setErrorMsg('Password must be at least 6 characters long and contain both letters and numbers (e.g. Civic2026).');
      return;
    }

    if (targetRole === 'ADMIN' && adminSecretKey !== 'CIVIC-ADMIN-2026') {
      setErrorMsg('Invalid Admin Authorization Secret Key. Contact municipal IT administrator.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/register`, {
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: targetRole
      });

      setSuccessMsg(`Registration successful as ${targetRole === 'ADMIN' ? 'Municipal Admin' : 'Citizen'}! Please sign in.`);
      setTimeout(() => {
        setView('login');
        clearMessages();
        setPassword('');
      }, 1400);

    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Email may already be registered.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Token Request
  const handleRequestToken = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/forgot-password`, { email: email.trim() });
      setSuccessMsg(response.data.message || 'Reset instructions sent to your email.');
      setTokenSent(true);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Execution
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!resetToken || !newPassword) {
      setErrorMsg('Please enter the reset token and your new password.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrorMsg('New password must be at least 6 characters long and contain both letters and numbers.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/reset-password`, {
        token: resetToken.trim(),
        newPassword: newPassword
      });

      setSuccessMsg(response.data.message || 'Password reset successfully! Please sign in.');
      setTimeout(() => {
        setView('login');
        setTokenSent(false);
        setResetToken('');
        setNewPassword('');
        clearMessages();
      }, 1500);

    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-satellite-viewport">
      <div className="auth-overlay-backdrop">
        
        {/* CENTERED GLASSMORPHIC CARD */}
        <div className="auth-glass-card">
          
          {/* Header Brand */}
          <div className="auth-card-brand">
            <div className="auth-brand-icon">
              <Globe size={26} color="#ffffff" />
            </div>
            <div>
              <h1 className="auth-brand-title">CivicConnect</h1>
              <p className="auth-brand-sub">Municipal GIS Governance Portal</p>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert-success">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN VIEW */}
          {view === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="auth-form-header">
                <h2>Portal Sign In</h2>
                <p>Sign in to access your citizen dashboard or administrator portal</p>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="e.g. citizen@civic.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Password</label>
                <input
                  type="password"
                  className="auth-input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Authenticating...' : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="auth-nav-options">
                <span className="auth-link" onClick={() => { setView('register_citizen'); clearMessages(); }}>
                  Citizen Registration
                </span>
                <span className="auth-link" onClick={() => { setView('register_admin'); clearMessages(); }}>
                  Admin Registration
                </span>
                <span className="auth-link" onClick={() => { setView('forgot'); clearMessages(); }}>
                  Forgot Password?
                </span>
              </div>
            </form>
          )}

          {/* 2. CITIZEN REGISTRATION VIEW */}
          {view === 'register_citizen' && (
            <form onSubmit={(e) => handleRegister(e, 'CITIZEN')}>
              <div className="auth-form-header">
                <h2>Citizen Registration</h2>
                <p>Create a citizen account to submit and track municipal issues</p>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Full Legal Name</label>
                <input
                  type="text"
                  className="auth-input-field"
                  placeholder="e.g. Bhaskar Rao"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="e.g. bhaskar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Create Password</label>
                <input
                  type="password"
                  className="auth-input-field"
                  placeholder="Min 6 characters (letters & numbers)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Registering Citizen...' : (
                  <>
                    <span>Register Citizen Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="auth-nav-options">
                <span className="auth-link" onClick={() => { setView('login'); clearMessages(); }}>
                  Sign In
                </span>
                <span className="auth-link" onClick={() => { setView('register_admin'); clearMessages(); }}>
                  Admin Registration
                </span>
                <span className="auth-link" onClick={() => { setView('forgot'); clearMessages(); }}>
                  Forgot Password?
                </span>
              </div>
            </form>
          )}

          {/* 3. ADMIN REGISTRATION VIEW */}
          {view === 'register_admin' && (
            <form onSubmit={(e) => handleRegister(e, 'ADMIN')}>
              <div className="auth-form-header">
                <h2>Municipal Admin Registration</h2>
                <p>Register an authorized administrator account for city-wide triage</p>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Full Name / Official Title</label>
                <input
                  type="text"
                  className="auth-input-field"
                  placeholder="e.g. Admin Supervisor Bhaskar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Municipal Email Address</label>
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="e.g. admin@civic.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Create Password</label>
                <input
                  type="password"
                  className="auth-input-field"
                  placeholder="Min 6 characters (letters & numbers)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Admin Authorization Key</label>
                <input
                  type="text"
                  className="auth-input-field"
                  placeholder="CIVIC-ADMIN-2026"
                  value={adminSecretKey}
                  onChange={(e) => setAdminSecretKey(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #0077ff 0%, #0044bb 100%)' }} disabled={loading}>
                {loading ? 'Registering Admin...' : (
                  <>
                    <span>Register Municipal Admin</span>
                    <ShieldAlert size={18} />
                  </>
                )}
              </button>

              <div className="auth-nav-options">
                <span className="auth-link" onClick={() => { setView('login'); clearMessages(); }}>
                  Sign In
                </span>
                <span className="auth-link" onClick={() => { setView('register_citizen'); clearMessages(); }}>
                  Citizen Registration
                </span>
                <span className="auth-link" onClick={() => { setView('forgot'); clearMessages(); }}>
                  Forgot Password?
                </span>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <div>
              <div className="auth-form-header">
                <h2>Password Recovery</h2>
                <p>Request a security token to reset your account password</p>
              </div>

              {!tokenSent ? (
                <form onSubmit={handleRequestToken}>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Registered Email Address</label>
                    <input
                      type="email"
                      className="auth-input-field"
                      placeholder="e.g. bhaskar@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Sending Request...' : 'Send Reset Token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Reset Security Token</label>
                    <input
                      type="text"
                      className="auth-input-field"
                      placeholder="Enter token received in email"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">New Password</label>
                    <input
                      type="password"
                      className="auth-input-field"
                      placeholder="Min 6 characters (letters & numbers)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Updating Password...' : 'Confirm Reset Password'}
                  </button>
                </form>
              )}

              <div className="auth-nav-options">
                <span className="auth-link" onClick={() => { setView('login'); setTokenSent(false); clearMessages(); }}>
                  Sign In
                </span>
                <span className="auth-link" onClick={() => { setView('register_citizen'); clearMessages(); }}>
                  Citizen Registration
                </span>
                <span className="auth-link" onClick={() => { setView('register_admin'); clearMessages(); }}>
                  Admin Registration
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
