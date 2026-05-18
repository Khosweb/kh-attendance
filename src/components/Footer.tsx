import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      padding: '60px 0',
      backgroundColor: 'var(--white)',
      borderTop: '1px solid var(--soft-pink)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--primary-pink)',
            marginBottom: '10px'
          }}>
            PINK<span style={{ color: 'var(--deep-grey)' }}>BLISS</span>
          </div>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>
            © {new Date().getFullYear()} PinkBliss Inc. All rights reserved.
          </p>
        </div>
        <ul style={{
          display: 'flex',
          gap: '25px',
          color: 'var(--deep-grey)',
          fontWeight: 500
        }}>
          <li><a href="#" style={{ '&:hover': { color: 'var(--primary-pink)' } } as any}>Twitter</a></li>
          <li><a href="#" style={{ '&:hover': { color: 'var(--primary-pink)' } } as any}>Instagram</a></li>
          <li><a href="#" style={{ '&:hover': { color: 'var(--primary-pink)' } } as any}>LinkedIn</a></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
