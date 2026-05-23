/**
 * CSS-only floating particle background.
 * Uses keyframe animations on a few div elements — zero JS runtime cost,
 * all animations run on the GPU compositor via transform + opacity.
 */
export default function AIToolParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full animate-particle-float"
        style={{
          background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)',
          animationDuration: '12s',
        }}
      />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full animate-particle-float"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          animationDuration: '15s',
          animationDirection: 'reverse',
        }}
      />

      {/* Floating micro-dots */}
      {[
        { top: '10%', left: '15%', size: 2, delay: '0s', dur: '8s', hue: 195 },
        { top: '20%', left: '75%', size: 1.5, delay: '1.5s', dur: '10s', hue: 270 },
        { top: '35%', left: '50%', size: 2.5, delay: '3s', dur: '9s', hue: 195 },
        { top: '50%', left: '20%', size: 1.5, delay: '0.5s', dur: '11s', hue: 270 },
        { top: '60%', left: '80%', size: 2, delay: '2s', dur: '7s', hue: 195 },
        { top: '70%', left: '40%', size: 1.5, delay: '4s', dur: '13s', hue: 270 },
        { top: '80%', left: '65%', size: 2, delay: '1s', dur: '10s', hue: 195 },
        { top: '15%', left: '35%', size: 1, delay: '5s', dur: '12s', hue: 270 },
        { top: '45%', left: '90%', size: 2, delay: '2.5s', dur: '9s', hue: 195 },
        { top: '85%', left: '10%', size: 1.5, delay: '3.5s', dur: '14s', hue: 270 },
        { top: '25%', left: '60%', size: 1, delay: '6s', dur: '11s', hue: 195 },
        { top: '90%', left: '45%', size: 2, delay: '1.8s', dur: '8s', hue: 270 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-particle-drift"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            background: `hsla(${dot.hue}, 80%, 60%, 0.25)`,
            boxShadow: `0 0 ${dot.size * 3}px hsla(${dot.hue}, 80%, 60%, 0.15)`,
            animationDuration: dot.dur,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}
