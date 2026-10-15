import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  Search,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Globe,
  FileCode,
  Sparkles,
  Info,
  Check,
  AlertTriangle
} from 'lucide-react';

export const GoogleSearchConsoleModal = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [activeToken, setActiveToken] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Read current token on open
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('anusha_gsc_verification_token') || '';
      const envToken = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || '';
      const existingMeta = document.querySelector('meta[name="google-site-verification"]');
      const metaContent = existingMeta?.getAttribute('content') || '';

      const current = savedToken || (metaContent !== '%VITE_GOOGLE_SITE_VERIFICATION%' ? metaContent : '') || envToken;
      setActiveToken(current);
      setTokenInput(current);
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveToken = () => {
    let cleanToken = tokenInput.trim();
    // If user pasted full tag: <meta name="google-site-verification" content="xyz" />
    const match = cleanToken.match(/content=["']([^"']+)["']/i);
    if (match) {
      cleanToken = match[1];
    }
    cleanToken = cleanToken.replace(/^google-site-verification=/i, '').trim();

    localStorage.setItem('anusha_gsc_verification_token', cleanToken);
    setActiveToken(cleanToken);
    setTokenInput(cleanToken);

    // Update the live DOM meta tag immediately
    let metaTag = document.querySelector('meta[name="google-site-verification"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'google-site-verification');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', cleanToken);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const origin = window.location.origin;
  const sitemapUrl = `${origin}/sitemap.xml`;
  const robotsUrl = `${origin}/robots.txt`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SEO Optimization & Google Search Console"
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>
        
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
              <Search size={20} />
              <span>Google Search Console Integration</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>
              Verify domain ownership, track Google rankings, and submit your live sitemap.
            </p>
          </div>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#ffffff',
              color: '#0369a1',
              fontWeight: 700,
              fontSize: '12px',
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span>Open Search Console</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Section 1: Verification Token Input */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#0284c7" />
              <span>Google Site Verification Code</span>
            </label>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: activeToken ? '#ecfdf5' : '#fef3c7',
              color: activeToken ? '#059669' : '#d97706',
              border: `1px solid ${activeToken ? '#a7f3d0' : '#fde68a'}`
            }}>
              {activeToken ? '✓ Verification Tag Active' : 'Pending Verification'}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px' }}>
            Copy your token from Google Search Console (under <strong>HTML tag</strong> method) and paste it below:
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. D39f8s9FkaL8_s982348fsd98f7sdf78sdf (or full meta tag)"
              style={{
                flex: 1,
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleSaveToken}
              className="btn btn-primary"
              style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              {isSaved ? <Check size={16} /> : <CheckCircle2 size={16} />}
              <span>{isSaved ? 'Applied!' : 'Save & Apply'}</span>
            </button>
          </div>

          {activeToken && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              background: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              color: '#334155',
              fontFamily: 'monospace',
              overflowX: 'auto'
            }}>
              &lt;meta name="google-site-verification" content="{activeToken}" /&gt;
            </div>
          )}
        </div>

        {/* Section 2: Sitemap & Robots.txt Links */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 18px'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={16} color="#0284c7" />
            <span>Search Engine Files (Ready for Submission)</span>
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* Sitemap Card */}
            <div style={{
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>XML Sitemap</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                  11 Routes Indexed
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                {sitemapUrl}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(sitemapUrl, 'sitemap')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'sitemap' ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  <span>{copiedKey === 'sitemap' ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href={sitemapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  <ExternalLink size={12} />
                  <span>Preview</span>
                </a>
              </div>
            </div>

            {/* Robots.txt Card */}
            <div style={{
              padding: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Robots.txt</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                  Crawlers Allowed
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                {robotsUrl}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(robotsUrl, 'robots')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedKey === 'robots' ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  <span>{copiedKey === 'robots' ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href={robotsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  <ExternalLink size={12} />
                  <span>Preview</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Step-by-Step Instructions */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 18px'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#0284c7" />
            <span>How to Connect Google Search Console in 3 Minutes</span>
          </h4>

          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#334155', lineHeight: 1.7 }}>
            <li>
              Open{' '}
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: 600 }}>
                Google Search Console
              </a>{' '}
              and sign in with your Google Account.
            </li>
            <li>
              Click <strong>Add property</strong>, select <strong>URL prefix</strong>, and enter your live domain (e.g. <code>https://anusha-enterprises.vercel.app</code>).
            </li>
            <li>
              Under <em>"Other verification methods"</em>, choose <strong>HTML tag</strong>.
            </li>
            <li>
              Copy the verification code (the value inside <code>content="..."</code>) and paste it into the input box above, then click <strong>Save & Apply</strong>.
            </li>
            <li>
              Return to Google Search Console and click the <strong>Verify</strong> button.
            </li>
            <li>
              Once verified, navigate to <strong>Sitemaps</strong> in the left sidebar, type <code>sitemap.xml</code> in the "Add a new sitemap" box, and click <strong>Submit</strong>!
            </li>
          </ol>
        </div>

        {/* Section 4: SEO Architecture Status */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 16px',
          background: '#ffffff'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Active SEO Optimization Checklist
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
              <CheckCircle2 size={14} /> <span>Dynamic Page & Tab Titles</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
              <CheckCircle2 size={14} /> <span>Meta Description & Keywords</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
              <CheckCircle2 size={14} /> <span>Schema.org LocalBusiness JSON-LD</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
              <CheckCircle2 size={14} /> <span>Open Graph & Twitter Cards</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
              <CheckCircle2 size={14} /> <span>PWA Manifest (manifest.json)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669' }}>
              <CheckCircle2 size={14} /> <span>Robots.txt & Sitemap.xml</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
          >
            <span>Test Structured Data (Rich Results)</span>
            <ExternalLink size={12} />
          </a>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 18px', fontWeight: 600 }}
          >
            Close
          </button>
        </div>

      </div>
    </Modal>
  );
};
