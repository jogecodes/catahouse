import { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);

  // Custom color palette
  const bgMain = 'bg-[#181210]'; // very dark background
  const bgCard = 'bg-[#3e2f28]/95'; // lighter brown, more opaque for card
  const inputBg = 'bg-[#251b17]'; // modern input background
  const accent = 'bg-[#bfae9f]'; // pastel beige
  const accentText = 'text-[#2d2320]'; // dark brown for text on accent
  const shadow = 'shadow-2xl'; // strong shadow for floating effect

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProfileUrl('');
    setMovies([]);
    setLoading(true);
    try {
      const res = await fetch(`./php-backend/get-movies.php?username=${username}`);
      const data = await res.json();
      if (data.movies && data.movies.length > 0) {
        setMovies(data.movies);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('No movies found.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  const handleCheckAnother = () => {
    setProfileUrl('');
    setMovies([]);
    setUsername('');
  };

  return (
    <div className={`min-h-screen w-screen flex items-center justify-center ${bgMain} text-[#f5ede6] transition-colors duration-500`}>
      <div
        className={`relative w-[900px] h-[600px] max-w-full max-h-full mx-auto px-12 py-20 sm:px-24 sm:py-32 ${bgCard} ${shadow} flex flex-col justify-between items-center overflow-hidden sm:h-[600px] h-screen`}
        style={{ backdropFilter: 'blur(2px)', borderRadius: '0.625rem' }}
      >
        {/* Restart arrow in the top left */}
        {profileUrl && (
          <button
            className={`absolute top-6 left-6 z-20 p-2 rounded-full ${accent} ${accentText} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#bfae9f] transition-colors flex items-center justify-center`}
            onClick={handleCheckAnother}
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1 flex flex-col items-start justify-center w-auto">
          {!movies.length && (
            <>
              <div>
                <div className="text-3xl font-bold tracking-normal drop-shadow-lg text-center leading-none">YOUR MOVIE TASTE</div>
                <div className="text-m font-semibold text-center opacity-80 -mt-2 -mb-4">(probably)</div>
                <div className="text-8xl font-extrabold tracking-normal drop-shadow-lg text-center leading-none">SUCKS</div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col items-start w-full mt-8">
                <label htmlFor="username" className="mt-4 mb-1 text-lg font-medium tracking-normal text-center w-full">
                  Enter your Letterboxd username
                </label>
                <div className="relative flex flex-row items-center w-full mb-2 mt-2">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full h-12 h-full px-5 text-[#f5ede6] ${inputBg} shadow-md rounded-l-lg focus:outline-none focus:shadow-inner focus:shadow-md text-lg transition-all duration-200 placeholder:text-[#bfae9f]/60 text-left`}
                    placeholder="e.g. davidlynch"
                    required
                    style={{ letterSpacing: '0.04em', border: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  />
                  <button
                    type="submit"
                    className={`h-12 px-5 ${accent} ${accentText} font-semibold rounded-r-lg hover:opacity-90 transition-colors flex items-center justify-center disabled:opacity-50 text-left`}
                    disabled={loading}
                    aria-label="Submit"
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-4-4m4 4l-4 4" />
                    </svg>
                  </button>
                  {/* Error message absolutely positioned below input */}
                  <div style={{ position: 'absolute', left: 0, top: '100%', width: '100%', minHeight: '1.5em', pointerEvents: 'none' }}>
                    {error && <p className="mt-1 text-red-400 text-sm w-full">{error}</p>}
                  </div>
                </div>
              </form>
            </>
          )}
          {loading && (
            <div className="text-center">
              <div className="text-2xl font-bold mb-4 text-[#bfae9f]">whoah you've really watched a lot of movies</div>
              <div className="text-lg opacity-80">Loading your rated movies...</div>
            </div>
          )}
          {movies.length > 0 && (
            <>
              <div className="text-2xl font-bold mb-4">Seen Movies</div>
              <ul className="max-h-80 overflow-y-auto w-full text-left pl-4 pr-2">
                {movies.map((movie, idx) => (
                  <li key={movie.url} className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    <a href={movie.url} target="_blank" rel="noopener noreferrer" className="underline text-[#bfae9f] hover:opacity-80 font-semibold">
                      {movie.title}
                    </a>
                    {movie.rating && (
                      <span className="ml-2 text-yellow-400 text-base font-mono">{movie.rating}</span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 px-4 py-2 ${accent} ${accentText} font-semibold rounded-lg hover:opacity-90 transition-colors`}
                onClick={handleCheckAnother}
              >
                Check another user
              </button>
            </>
          )}
        </div>
        {/* Footer disclaimer absolutely at the bottom */}
        <footer className="absolute left-0 right-0 bottom-0 text-[#bfae9f]/60 text-xs tracking-wider text-center w-full max-w-xs mx-auto mb-2 pointer-events-none select-none">
          By any means affiliated with Letterboxd...
        </footer>
      </div>
    </div>
  );
}

export default App;
