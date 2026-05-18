import React from 'react';

const Hero: React.FC = () => {
  return (
    <section style={{
      padding: '160px 0 100px',
      background: 'linear-gradient(135deg, var(--white) 0%, var(--soft-pink) 100%)',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '50px',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '3.5rem',
            lineHeight: 1.1,
            marginBottom: '20px',
            color: 'var(--deep-grey)'
          }}>
            Bring <span style={{ color: 'var(--primary-pink)' }}>Elegance</span> to Your Everyday Life
          </h1>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '35px',
            color: '#666'
          }}>
            Experience the perfect blend of minimalist design and vibrant aesthetics. Our platform helps you create something beautiful, every single day.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button className="btn-primary">Start Your Journey</button>
            <button style={{
              padding: '12px 28px',
              borderRadius: '50px',
              fontWeight: 600,
              backgroundColor: 'transparent',
              border: '2px solid var(--primary-pink)',
              color: 'var(--primary-pink)'
            }}>Learn More</button>
          </div>
        </div>
        <div style={{
          position: 'relative',
          height: '400px',
          background: 'var(--white)',
          borderRadius: '30px',
          boxShadow: '0 20px 40px rgba(255, 133, 161, 0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          {/* Visual Placeholder */}
          <div style={{
            width: '200px',
            height: '200px',
            background: 'var(--primary-pink)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            opacity: 0.4
          }}></div>
          <div style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            border: '8px solid var(--soft-pink)',
            borderRadius: '20px',
            transform: 'rotate(15deg)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            width: '80px',
            height: '80px',
            background: 'var(--primary-pink)',
            borderRadius: '15px',
            transform: 'rotate(-10deg)'
          }}></div>
          <div style={{
             fontSize: '5rem',
             zIndex: 1
          }}>🌸</div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
