import { Link } from 'react-router-dom';

const portals = [
  { title: 'Patient', description: 'Your dental care, in one place', href: '/login/patient', action: 'Patient login' },
  { title: 'Clinic', description: 'Manage your practice and team', href: '/login/clinic', action: 'Clinic login' },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <header className="public-nav">
        <Link className="brand-lockup" to="/" aria-label="ChiriKaro home"><span className="brand-mark">C</span><span>ChiriKaro</span></Link>
        <nav aria-label="Account navigation"><Link to="/login/patient">Sign in</Link><Link className="button button-primary button-small" to="/register/patient">Create patient account</Link></nav>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Connected dental care</p>
          <h1>Better care starts with a <em>clearer picture.</em></h1>
          <p className="hero-description">A calmer way for patients and clinics to stay connected, from the first appointment to the next smile.</p>
          <div className="hero-actions"><Link className="button button-primary" to="/register/patient">Get started <span aria-hidden="true">&#8594;</span></Link><Link className="text-link" to="/register/clinic">Register your clinic</Link></div>
          <div className="hero-note"><span className="note-rule" /> Built for the people behind every healthy smile</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a dental clinic appointment card">
          <div className="art-grid" />
          <div className="appointment-sheet">
            <div className="sheet-top"><span className="sheet-icon">CK</span><span className="sheet-status"><i /> Confirmed</span></div>
            <p className="sheet-label">NEXT APPOINTMENT</p>
            <h2>Routine check-up</h2>
            <div className="appointment-doctor"><span className="doctor-avatar">DR</span><div><strong>Dr. Meera Shah</strong><small>General dentistry</small></div></div>
            <div className="appointment-meta"><span>18 October 2026</span><span>10:30 AM</span></div>
            <div className="sheet-line" /><div className="sheet-footer"><span>Greenwood Dental Care</span><span className="sheet-arrow">&#8599;</span></div>
          </div>
          <div className="art-caption"><span className="caption-line" /> Care that keeps moving forward</div>
        </div>
      </section>

      <section className="portal-strip" aria-label="Choose your portal">
        <div className="portal-strip-heading"><p className="eyebrow">One platform, every perspective</p><h2>Choose your workspace</h2></div>
        <div className="portal-links">{portals.map((portal, index) => <article className="portal-link" key={portal.title}><span className={`portal-index portal-index-${index + 1}`}>0{index + 1}</span><div><h3>{portal.title}</h3><p>{portal.description}</p></div><Link to={portal.href} aria-label={portal.action}>&#8594;</Link></article>)}</div>
      </section>
      <footer className="public-footer"><span>ChiriKaro <span className="footer-separator">/</span> Dental care, connected</span></footer>
    </main>
  );
}