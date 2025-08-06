import { useState } from 'react';
import ProgressBar from './components/ProgressBar';

function App() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progressData, setProgressData] = useState(null);
  const [graphData, setGraphData] = useState(null);

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
    setProgress(0);
    setProgressData(null);
    setGraphData(null);
    setLoading(true);
    
            // Start with initial progress
    setProgress(5);
    
    try {
      // First get the total count from count-movies.php
      const countRes = await fetch(`https://yourmovietasteprobablysucks.com/php-backend/count-movies.php?username=${username}`);
      const countData = await countRes.json();
      
      if (countData.success) {
        // Set progress data with real total immediately
        setProgressData({
          totalMovies: countData.total_movies,
          executionTime: 0,
          message: 'Starting to scrape movies...'
        });
      }
      
            // Use Server-Sent Events for real progress
      const eventSourceUrl = `https://yourmovietasteprobablysucks.com/php-backend/get-graph-data-dissident.php?username=${username}`;
      console.log('Creating EventSource with URL:', eventSourceUrl);
      const eventSource = new EventSource(eventSourceUrl);
      
      eventSource.onmessage = function(event) {
        console.log('EventSource message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed SSE data:', data);
          
          if (data.type === 'progress') {
            // Update progress with real data (but keep original totalMovies)
            setProgress(data.progress);
            setProgressData(prev => ({
              ...prev,
              executionTime: 0,
              currentPage: data.page,
              totalPages: data.total_pages,
              message: data.message
            }));
          } else if (data.type === 'complete') {
            // Use all_movies from graph data
            setMovies(data.all_movies);
            setProgress(100);
            setProgressData({
              totalMovies: data.total_movies,
              executionTime: data.execution_time_ms,
              currentPage: data.total_pages,
              totalPages: data.total_pages
            });
            // Save complete graph data
            setGraphData(data);
            eventSource.close();
            setLoading(false);
          } else if (data.type === 'error') {
            setError(data.error);
            eventSource.close();
            setLoading(false);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
          console.error('Raw SSE data:', event.data);
        }
      };
      
      eventSource.onopen = function(event) {
        console.log('EventSource opened successfully');
      };
      
      eventSource.onerror = function(event) {
        console.log('EventSource failed, using fallback');
        console.log('EventSource error details:', event);
        console.log('EventSource readyState:', eventSource.readyState);
        eventSource.close();
        
        // Fallback to regular fetch
        fetch(`https://yourmovietasteprobablysucks.com/php-backend/get-graph-data-dissident.php?username=${username}`)
          .then(res => {
            console.log('Fetch response status:', res.status);
            console.log('Fetch response headers:', res.headers);
            return res.text();
          })
          .then(text => {
            console.log('Raw response text:', text);
            
            // Handle SSE format (data: {...})
            const lines = text.split('\n');
            let lastData = null;
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.substring(6); // Remove 'data: ' prefix
                  const data = JSON.parse(jsonStr);
                  console.log('Parsed SSE data:', data);
                  lastData = data;
                  
                  // Handle progress updates
                  if (data.type === 'progress') {
                    setProgress(data.progress);
                    setProgressData(prev => ({
                      ...prev,
                      message: data.message,
                      totalMovies: data.total_movies
                    }));
                  }
                } catch (parseErr) {
                  console.error('JSON parse error for line:', line, parseErr);
                }
              }
            }
            
            // Handle final data
            if (lastData && lastData.all_movies && lastData.all_movies.length > 0) {
              setMovies(lastData.all_movies);
              setProgress(100);
              setProgressData(prev => ({
                ...prev,
                executionTime: lastData.execution_time_ms
              }));
              setGraphData(lastData);
              setLoading(false);
            } else if (lastData && lastData.error) {
              setError(lastData.error);
              setLoading(false);
            } else {
              setError('No movies found in response.');
              setLoading(false);
            }
          })
          .catch(err => {
            console.error('Fetch error:', err);
            setError(`Network error: ${err.message}`);
            setLoading(false);
          });
      };
    } catch (err) {
      setError('Network error.');
      setLoading(false);
    }
  };

  const handleCheckAnother = () => {
    setProfileUrl('');
    setMovies([]);
    setUsername('');
    setProgress(0);
    setProgressData(null);
    setGraphData(null);
  };

  return (
    <div className={`min-h-screen w-screen flex items-center justify-center ${bgMain} text-[#f5ede6] transition-colors duration-500`}>
      <div
        className={`relative w-[900px] max-w-full mx-auto px-6 sm:px-24 sm:py-16 flex flex-col items-center h-full`}
      >

        <div className="flex-1 flex flex-col items-center justify-center w-full pt-8 sm:pt-0 sm:pb-0 h-full">
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
              <div className="text-xl opacity-80 mb-8">Whoah... you've really watched a lot of movies, do you even have a life?</div>
              
              {progressData ? (
                <ProgressBar
                  progress={progress}
                  totalMovies={progressData.totalMovies}
                  executionTime={progressData.executionTime}
                  currentPage={progressData.currentPage}
                  totalPages={progressData.totalPages}
                  message={progressData.message}
                />
              ) : (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bfae9f] mx-auto"></div>
              )}
            </div>
          )}
          {movies.length > 0 && (
            <div className="flex flex-col w-full h-full">
              <div className="flex justify-center items-center mb-4">
                <div className="text-2xl font-bold text-center">Watched Movies</div>
              </div>
              <div className="mb-4" style={{ height: '50vh' }}>
                <ul 
                  className="overflow-y-auto w-full text-left pl-2 pr-2 space-y-2 custom-scrollbar h-full"
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
                      <div className="flex flex-col items-end gap-1 text-xs">
                        {movie.user_rating && (
                          <span className="text-yellow-400 font-mono">{movie.user_rating}</span>
                        )}
                        {movie.dissident_score !== undefined && (
                          <span className={`font-mono ${movie.dissident_score > 0 ? 'text-green-400' : movie.dissident_score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {movie.dissident_score > 0 ? '+' : ''}{movie.dissident_score}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                  
                  {/* JSON Data integrated in the same list */}
                  {graphData && (
                    <>
                      <li className="pt-4 pb-2">
                        <div className="text-lg font-semibold text-[#bfae9f] text-center border-t border-[#bfae9f]/20 pt-4">
                          Complete Analysis Data
                        </div>
                      </li>
                      <li>
                        <pre className="text-xs text-[#f5ede6] whitespace-pre-wrap font-mono">
                          {JSON.stringify(graphData, null, 2)}
                        </pre>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <button
                className={`px-4 py-2 ${accent} ${accentText} font-semibold rounded-lg hover:opacity-90 transition-colors w-full`}
                onClick={handleCheckAnother}
              >
                Roast another "cinephile"
              </button>
            </div>
          )}
        </div>
        {/* Footer disclaimer at the bottom */}
        <footer className="mt-4 text-[#bfae9f]/60 text-xs tracking-wider text-center w-full max-w-xs mx-auto pointer-events-none select-none">
          (By any means affiliated with Letterboxd)
        </footer>
      </div>
    </div>
  );
}

export default App;
