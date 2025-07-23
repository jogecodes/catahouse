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
        className={`relative w-[900px] max-w-full mx-auto px-6 py-8 sm:px-24 sm:py-16 ${bgCard} ${shadow} flex flex-col items-center min-h-screen sm:h-[600px]`}
        style={{ backdropFilter: 'blur(2px)', borderRadius: '0.625rem' }}
      >

        <div className="flex-1 flex flex-col items-center justify-center w-full pt-8 sm:pt-0">
          {!movies.length && !loading && (
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
                    className={`w-full h-12 px-5 text-[#f5ede6] ${inputBg} shadow-md rounded-l-lg focus:outline-none focus:shadow-inner focus:shadow-md text-lg transition-all duration-200 placeholder:text-[#bfae9f]/60 text-left`}
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
            <div className="text-center w-full">
              <div className="text-2xl font-bold mb-6 text-[#bfae9f]">Loading films for {username}</div>
              <div className="text-xl opacity-80 mb-8">Whoah... you've really seen a lot of movies, do you even have a life?</div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfae9f] mx-auto"></div>
            </div>
          )}
          {movies.length > 0 && (
            <div className="flex flex-col h-full w-full max-h-full">
              <div className="flex justify-center items-center mb-4">
                <div className="text-2xl font-bold text-center">Seen Movies</div>
              </div>
              <div className="flex-1 min-h-0 max-h-full">
                <ul 
                  className="h-full overflow-y-auto w-full text-left pl-2 pr-2 space-y-2"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#bfae9f rgba(191, 174, 159, 0.1)'
                  }}
                >
                  {movies.map((movie, idx) => (
                    <li key={movie.url} className="flex items-start gap-2">
                      <span className="text-[#bfae9f] font-semibold flex-1 min-w-0">
                        {movie.title}
                      </span>
                      {movie.rating && (
                        <span className="text-yellow-400 text-base font-mono flex-shrink-0">{movie.rating}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className={`mt-6 px-4 py-2 ${accent} ${accentText} font-semibold rounded-lg hover:opacity-90 transition-colors w-full`}
                onClick={handleCheckAnother}
              >
                Roast another "cinephile"
              </button>
            </div>
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
