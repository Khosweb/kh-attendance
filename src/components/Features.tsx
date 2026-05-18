import React from 'react';

const features = [
  {
    icon: '✨',
    title: 'Pure Aesthetics',
    description: 'Beautifully crafted interfaces that prioritize visual harmony and user delight.'
  },
  {
    icon: '🎨',
    title: 'Custom Themes',
    description: 'Switch between soft pastels and vibrant tones with our flexible styling engine.'
  },
  {
    icon: '🚀',
    title: 'Fast & Reliable',
    description: 'Built on top-tier technology to ensure your experience is smooth and responsive.'
  }
];

const Features: React.FC = () => {
  return (
    <section style={{ padding: '100px 0', backgroundColor: 'var(--white)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Why Choose <span style={{ color: 'var(--primary-pink)' }}>PinkBliss</span>?</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: '#666' }}>
            We combine high-end design with functional excellence to provide the best possible experience for our users.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '30px'
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              padding: '40px',
              borderRadius: '24px',
              backgroundColor: 'var(--white)',
              border: '1px solid var(--soft-pink)',
              textAlign: 'center',
              transition: 'var(--transition)',
              cursor: 'default'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(255, 133, 161, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px'
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{f.title}</h3>
              <p style={{ color: '#666' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
