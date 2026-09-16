import React from 'react';
import { MapPin, Phone, ShieldCheck, Clock, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      padding: '24px 20px',
      marginTop: 'auto',
      color: '#64748b',
      fontSize: '12px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Brand identity & logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/logo.png"
            alt="Anusha Enterprises Logo"
            style={{
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
              borderRadius: '6px'
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', letterSpacing: '-0.01em' }}>
              ANUSHA ENTERPRISES
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={12} color="#0284c7" /> Nandipet, Nizamabad, Telangana
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: 600 }}>
                <Award size={12} /> 12+ Years of Trust
              </span>
            </div>
          </div>
        </div>


        {/* Copyright & Security */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', color: '#059669', fontWeight: 600 }}>
            <ShieldCheck size={14} /> Cloud Secured Database & Realtime Ledger
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
            © {new Date().getFullYear()} Anusha Enterprises. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
