import { Facebook, Github, Instagram, Mail, MapPin, ShieldCheck, Contact } from "lucide-react";

import "./LeftBrandPanel.css";

export function LeftPanel() {
  return (
    <div className="brand-panel">
      <div className="logo-section">
        <img src="/logos/logo.png" alt="Classgrid Logo" className="logo-img" />
        <div className="logo-text">
          <h1>Classgrid</h1>
          <p>Classgrid Classroom</p>
        </div>
      </div>

      <div className="intro-description">
        <p style={{ marginBottom: "1rem" }}>
          An AI-powered intelligent classroom ecosystem that combines structured academic
          workflows, connected communication, and secure platform operations.
        </p>
      </div>

      <div className="contact-info">
        <h3>
          <Contact size={18} />
          <span>Contact Information</span>
        </h3>
        <div className="contact-item">
          <Mail size={16} />
          <span>support@classgrid.in</span>
        </div>
        <div className="contact-item">
          <MapPin size={16} />
          <span>Sector 26, Pradhikaran, Nigdi, Pune, Maharashtra 411044</span>
        </div>
      </div>

      <div className="security-link">
        <a href="/security">
          <ShieldCheck size={16} />
          <span>Security &amp; Privacy</span>
        </a>
      </div>

      <div className="social-links">
        <a
          href="https://www.instagram.com/classgridedu/"
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <Instagram size={20} />
        </a>
        <a
          href="https://github.com/nikhilnick5050"
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Github size={20} />
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61588646851017"
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <Facebook size={20} />
        </a>
      </div>
    </div>
  );
}
