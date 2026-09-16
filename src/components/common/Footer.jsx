import React from 'react';
import { MapPin, Phone, ShieldCheck, Clock, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Brand identity & logo */}
        <div className="footer-brand">
          <img
            src="/logo.png"
            alt="Anusha Enterprises Logo"
            className="footer-logo"
          />
          <div className="footer-brand-text">
            <div className="footer-title">
              ANUSHA ENTERPRISES
            </div>
            <div className="footer-location-row">
              <span className="footer-meta-item">
                <MapPin size={12} color="#0284c7" /> Nandipet, Nizamabad, Telangana
              </span>
              <span className="footer-meta-dot">•</span>
              <span className="footer-trust-badge">
                <Award size={12} /> 12+ Years of Trust
              </span>
            </div>
          </div>
        </div>

        {/* Copyright & Security */}
        <div className="footer-security-container">
          <div className="footer-security-pill">
            <ShieldCheck size={14} /> Cloud Secured Database & Realtime Ledger
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Anusha Enterprises. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
