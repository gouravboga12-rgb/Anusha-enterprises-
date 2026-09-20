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
