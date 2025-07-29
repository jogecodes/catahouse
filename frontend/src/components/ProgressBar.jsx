import React from 'react';

const ProgressBar = ({ progress, totalMovies, executionTime, currentPage, totalPages, message }) => {
  const accent = 'bg-[#bfae9f]';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="w-full bg-[#251b17] rounded-full h-3 mb-4 overflow-hidden">
                          <div
                    className={`h-full ${accent} transition-all duration-300 ease-out rounded-full`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
      </div>
      
      {/* Progress Details */}
      <div className="text-center space-y-2">
                                  <div className="text-2xl font-bold text-[#bfae9f]">
          {Math.min(progress, 100).toFixed(1)}%
        </div>
        
        {/* Loading Animation */}
        <div className="flex justify-center mt-4">
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-[#bfae9f] rounded-full"></div>
            <div className="w-2 h-2 bg-[#bfae9f] rounded-full animation-delay-200"></div>
            <div className="w-2 h-2 bg-[#bfae9f] rounded-full animation-delay-400"></div>
          </div>
        </div>
        
                            {/* Status Message */}
                    <div className="text-xs opacity-60 mt-2">
                      {message || (progress < 30 ? 'Initializing...' :
                       progress < 70 ? 'Scraping Letterboxd...' :
                       progress < 100 ? 'Processing data...' : 'Complete!')}
                    </div>
      </div>
    </div>
  );
};

export default ProgressBar; 