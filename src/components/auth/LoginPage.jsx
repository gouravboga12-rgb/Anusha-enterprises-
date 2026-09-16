import React, { useState } from 'react';
import { Lock, Mail, Phone, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

export const LoginPage = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Accepted credentials:
  // ID: shivat9640@gmail.com or 96409 12521
  // Password: 96409 12521
  const normalizeText = (str) => (str || '').toLowerCase().replace(/\s+/g, '').trim();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanInputId = normalizeText(identifier).replace(/^\+91/, '');
      const cleanInputPwd = (password || '').trim();

      const validEmails = ['shivat9640@gmail.com'];
      const validPhones = ['9640912521', '96409 12521'];
      const validPasswords = ['96409 12521', '9640912521'];

      const isEmailMatch = validEmails.some((email) => normalizeText(email) === cleanInputId);
      const isPhoneMatch = validPhones.some((phone) => normalizeText(phone) === cleanInputId);
      const isPasswordMatch = validPasswords.some((pwd) => pwd === cleanInputPwd || normalizeText(pwd) === normalizeText(cleanInputPwd));

      if ((isEmailMatch || isPhoneMatch) && isPasswordMatch) {
        const userObj = {
          email: 'shivat9640@gmail.com',
          phone: '96409 12521',
          name: 'Shiva',
          role: 'Owner / Administrator',
          loginTime: new Date().toISOString()
        };
        onLoginSuccess(userObj);
      } else {
        setIsLoading(false);
        if (!isEmailMatch && !isPhoneMatch) {
          setError('Invalid ID. Please enter shivat9640@gmail.com or 96409 12521');
        } else {
          setError('Incorrect password. Please verify your password and try again.');
        }
      }
    }, 400);
  };

  const handleQuickFillEmail = () => {
    setIdentifier('shivat9640@gmail.com');
    setPassword('96409 12521');
    setError('');
  };

  const handleQuickFillPhone = () => {
    setIdentifier('96409 12521');
    setPassword('96409 12521');
    setError('');
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Brand Banner */}
        <div className="login-header">
          <div className="login-logo-wrap">
            <img
              src="/logo.png"
              alt="Anusha Enterprises"
              className="login-logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="login-brand-title">ANUSHA ENTERPRISES</h1>
          <p className="login-brand-sub">Digital Business Ledger & Control Center</p>
          <div className="login-trust-pill">
            <ShieldCheck size={13} color="#0284c7" />
            <span>Nandipet, Nizamabad • 12+ Years of Trust</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="login-form">
          <div style={{ marginBottom: '16px' }}>
            <label className="login-label">Email ID or Mobile Number</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
              </span>
              <input
                type="text"
                className="login-input"
                placeholder="shivat9640@gmail.com or 96409 12521"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                required
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="login-label" style={{ marginBottom: 0 }}>Password</label>
            </div>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
              />
              <button
                type="button"
                className="login-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error-badge">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="login-spinner"></span> Authenticating...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Sign In to Control Center <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="login-helpers">
          <p className="login-helpers-title">Quick Access Shortcut</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="login-helper-pill"
              onClick={handleQuickFillEmail}
            >
              <Mail size={12} /> Auto-fill with Email
            </button>
            <button
              type="button"
              className="login-helper-pill"
              onClick={handleQuickFillPhone}
            >
              <Phone size={12} /> Auto-fill with Mobile
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="login-footer">
          <Lock size={12} color="#64748b" />
          <span>Secured with PostgreSQL Cloud & Realtime Multi-Device Sync</span>
        </div>
      </div>
    </div>
  );
};
