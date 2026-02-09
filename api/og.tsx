import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'nodejs',
};

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF9',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Venn diagram logo */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '160px',
            height: '100px',
            marginBottom: '40px',
          }}
        >
          {/* Left circle — teal */}
          <div
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#14B8A6',
              opacity: 0.8,
            }}
          />
          {/* Right circle — pink */}
          <div
            style={{
              position: 'absolute',
              left: '60px',
              top: '0px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#F472B6',
              opacity: 0.8,
            }}
          />
          {/* Intersection — gold overlay */}
          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '12px',
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: '#EAB308',
              opacity: 0.85,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 300,
            color: '#18181B',
            letterSpacing: '-0.02em',
          }}
        >
          SCALAR
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
