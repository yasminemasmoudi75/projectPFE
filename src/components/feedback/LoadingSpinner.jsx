const LoadingSpinner = ({ fullScreen = false, size = 'md', text = 'Chargement en cours...' }) => {
  const sizes = {
    sm: { ring: 'w-6 h-6 border-2', logo: 'h-3 w-3' },
    md: { ring: 'w-12 h-12 border-2', logo: 'h-5 w-5' },
    lg: { ring: 'w-16 h-16 border-2', logo: 'h-7 w-7' },
  };
  const s = sizes[size] || sizes.md;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner ring + logo */}
      <div className="relative">
        <div
          className={`${s.ring} rounded-full border-slate-200 border-t-[#0062AF] animate-spin`}
          style={{ animationDuration: '0.7s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-[#0062AF] to-[#004a85] flex items-center justify-center shadow-sm">
            <img
              src="/images/logonexus.png"
              className={`${s.logo} object-contain opacity-90`}
              alt=""
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {text && (
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-600">{text}</p>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-[#0062AF]/40 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20 px-8">
      {content}
    </div>
  );
};

export default LoadingSpinner;
