export default function FlowingLeaf() {
  return (
    <div
      className="flowing-leaf-container"
      title="Sift — Fresh contract clarity"
      style={{
        position: 'fixed',
        top: '16px',
        right: '20px',
        zIndex: 99,
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(238, 242, 239, 0.85)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 2px 8px rgba(68, 93, 72, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <svg
        className="flowing-leaf-icon"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          color: 'var(--color-sage)',
          animation: 'leafFlow 4s ease-in-out infinite',
          transformOrigin: 'bottom left',
        }}
      >
        <path
          d="M20.5 3.5C13.5 3.5 7 8 5 15C4.5 16.7 4.2 18.5 4 20C5.5 19.8 7.3 19.5 9 19C16 17 20.5 10.5 20.5 3.5Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 20C8.5 15.5 13.5 10.5 20.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 14C11.5 15 13.5 15.5 15 15"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M14 10C15 11 16.5 11.5 18 11"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
