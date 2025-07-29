<?php
// Global configuration
define('N_MOST_POPULAR', 5);
define('N_LEAST_POPULAR', 5);
define('N_MOST_RECENT', 5);
define('N_LEAST_RECENT', 5);
define('N_MOST_RECENT_RELEASE', 5);
define('N_LEAST_RECENT_RELEASE', 5);
define('N_BEST_COMMUNITY_RATE', 5);
define('N_WORST_COMMUNITY_RATE', 5);
define('N_BEST_USER_RATE', 5);
define('N_WORST_USER_RATE', 5);

header('Access-Control-Allow-Origin: *');
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

// Start timing
$startTime = microtime(true);

if (!isset($_GET['username'])) {
    echo "data: " . json_encode(['error' => 'No username provided']) . "\n\n";
    exit;
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']); // sanitize
$baseUrl = "https://letterboxd.com/$username/films/by/entry-rating/";

// First, get the total number of movies with ratings
$countUrl = "https://letterboxd.com/$username/";
$ch = curl_init($countUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; MovieCounter/1.0)');
curl_setopt($ch, CURLOPT_ENCODING, '');
$countHtml = curl_exec($ch);
curl_close($ch);

// Extract total movies from the count page
$totalMovies = 0;
if (preg_match('/(\d+)\s+films?\s+watched/i', $countHtml, $matches)) {
    $totalMovies = (int)$matches[1];
}

$movies = [];
$page = 1;
$totalPages = 0;
$currentProgress = 0;

// Calculate total pages based on 72 movies per page
$estimatedMoviesPerPage = 72;

// Calculate total pages based on the total movies we expect
$totalPages = ceil($totalMovies / $estimatedMoviesPerPage);

// Send initial progress
echo "data: " . json_encode([
    'type' => 'progress',
    'progress' => 5,
    'page' => 0,
    'total_pages' => $totalPages,
    'total_movies' => $totalMovies,
    'message' => 'Starting to analyze movies...'
]) . "\n\n";

while (true) {
    $url = $baseUrl;
    if ($page > 1) {
        $url .= 'page/' . $page . '/';
    }
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 404 || !$html) {
        break;
    }

    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($html);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if (!$ul) {
        break;
    }

    $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
    foreach ($liNodes as $li) {
        $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
        $title = null;
        $url = null;
        $rating = null;
        
        if ($posterDiv) {
            $url = $posterDiv->getAttribute('data-target-link');
            if ($url && strpos($url, 'http') !== 0) {
                $url = 'https://letterboxd.com' . $url;
            }
            $img = $xpath->query('.//img', $posterDiv)->item(0);
            if ($img) {
                $title = $img->getAttribute('alt');
            }
        }
        
        // Get rating (all movies on this page are rated)
        $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
        $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
        
        // Include movie if we have title and url (rating is guaranteed)
        if ($title && $url) {
            $movies[] = [
                'title' => $title,
                'url' => $url,
                'user_rating' => $rating
            ];
        }
    }
    
    // Calculate progress based on current page
    $progress = min(90, 5 + (($page / $totalPages) * 85));
    
    // Send progress update
    echo "data: " . json_encode([
        'type' => 'progress',
        'progress' => round($progress, 1),
        'page' => $page,
        'total_pages' => $totalPages,
        'movies_found' => count($movies),
        'message' => "Analyzed page $page of $totalPages"
    ]) . "\n\n";
    
    if ($liNodes->length === 0) {
        break;
    }
    $page++;
}

if (empty($movies)) {
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => 'No rated movies found for this user'
    ]) . "\n\n";
    exit;
}

// Now get the most popular movies
$popularUrl = "https://letterboxd.com/$username/films/by/popular/";
$popularMovies = [];

$ch = curl_init($popularUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$popularHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 404 && $popularHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($popularHtml);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if ($ul) {
        $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
        $count = 0;
        
        foreach ($liNodes as $li) {
            if ($count >= N_MOST_POPULAR) break; // Only get first N_MOST_POPULAR
            
            $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
            $title = null;
            $url = null;
            $rating = null;
            
            if ($posterDiv) {
                $url = $posterDiv->getAttribute('data-target-link');
                if ($url && strpos($url, 'http') !== 0) {
                    $url = 'https://letterboxd.com' . $url;
                }
                $img = $xpath->query('.//img', $posterDiv)->item(0);
                if ($img) {
                    $title = $img->getAttribute('alt');
                }
            }
            
            // Get rating
            $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
            $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
            
            // Include movie if we have title and url
            if ($title && $url) {
                $popularMovies[] = [
                    'title' => $title,
                    'url' => $url,
                    'user_rating' => $rating
                ];
                $count++;
            }
        }
    }
}

// Now get the least popular movies (from the last page)
$leastPopularMovies = [];
if ($totalPages > 0) {
    $lastPageUrl = "https://letterboxd.com/$username/films/by/popular/page/$totalPages/";
    
    $ch = curl_init($lastPageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $leastPopularHtml = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 404 && $leastPopularHtml) {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($leastPopularHtml);
        $xpath = new DOMXPath($dom);

        $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
        if ($ul) {
            $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
            $allMoviesOnPage = [];
            
            // Collect all movies from the last page
            foreach ($liNodes as $li) {
                $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
                $title = null;
                $url = null;
                $rating = null;
                
                if ($posterDiv) {
                    $url = $posterDiv->getAttribute('data-target-link');
                    if ($url && strpos($url, 'http') !== 0) {
                        $url = 'https://letterboxd.com' . $url;
                    }
                    $img = $xpath->query('.//img', $posterDiv)->item(0);
                    if ($img) {
                        $title = $img->getAttribute('alt');
                    }
                }
                
                // Get rating
                $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
                $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
                
                // Include movie if we have title and url
                if ($title && $url) {
                    $allMoviesOnPage[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating
                    ];
                }
            }
            
            // Filter movies with ratings and get the last N_LEAST_POPULAR movies from the page
            $moviesWithRatings = array_filter($allMoviesOnPage, function($movie) {
                return !empty($movie['user_rating']);
            });
            
            // Get the last N_LEAST_POPULAR movies with ratings
            $leastPopularMovies = array_slice($moviesWithRatings, -N_LEAST_POPULAR);
        }
    }
}

// Now get the most recent movies (from /films/by/date/)
$recentMovies = [];
$recentUrl = "https://letterboxd.com/$username/films/by/date/";

$ch = curl_init($recentUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$recentHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 404 && $recentHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($recentHtml);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if ($ul) {
        $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
        $count = 0;
        
        foreach ($liNodes as $li) {
            if ($count >= N_MOST_RECENT) break; // Only get first N_MOST_RECENT
            
            $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
            $title = null;
            $url = null;
            $rating = null;
            
            if ($posterDiv) {
                $url = $posterDiv->getAttribute('data-target-link');
                if ($url && strpos($url, 'http') !== 0) {
                    $url = 'https://letterboxd.com' . $url;
                }
                $img = $xpath->query('.//img', $posterDiv)->item(0);
                if ($img) {
                    $title = $img->getAttribute('alt');
                }
            }
            
            // Get rating
            $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
            $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
            
            // Include movie if we have title, url, and rating
            if ($title && $url && !empty($rating)) {
                $recentMovies[] = [
                    'title' => $title,
                    'url' => $url,
                    'user_rating' => $rating
                ];
                $count++;
            }
        }
    }
}

// Now get the least recent movies (from the last page of /films/by/date/)
$leastRecentMovies = [];
if ($totalPages > 0) {
    $lastDatePageUrl = "https://letterboxd.com/$username/films/by/date/page/$totalPages/";
    
    $ch = curl_init($lastDatePageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $leastRecentHtml = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 404 && $leastRecentHtml) {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($leastRecentHtml);
        $xpath = new DOMXPath($dom);

        $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
        if ($ul) {
            $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
            $allMoviesOnDatePage = [];
            
            // Collect all movies from the last date page
            foreach ($liNodes as $li) {
                $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
                $title = null;
                $url = null;
                $rating = null;
                
                if ($posterDiv) {
                    $url = $posterDiv->getAttribute('data-target-link');
                    if ($url && strpos($url, 'http') !== 0) {
                        $url = 'https://letterboxd.com' . $url;
                    }
                    $img = $xpath->query('.//img', $posterDiv)->item(0);
                    if ($img) {
                        $title = $img->getAttribute('alt');
                    }
                }
                
                // Get rating
                $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
                $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
                
                // Include movie if we have title, url, and rating
                if ($title && $url && !empty($rating)) {
                    $allMoviesOnDatePage[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating
                    ];
                }
            }
            
            // Get the last N_LEAST_RECENT movies with ratings from the page
            $leastRecentMovies = array_slice($allMoviesOnDatePage, -N_LEAST_RECENT);
        }
    }
}

// Now get the most recent release movies (from /films/)
$mostRecentReleaseMovies = [];
$recentReleaseUrl = "https://letterboxd.com/$username/films/";

$ch = curl_init($recentReleaseUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$recentReleaseHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 404 && $recentReleaseHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($recentReleaseHtml);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if ($ul) {
        $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
        $count = 0;
        
        foreach ($liNodes as $li) {
            if ($count >= N_MOST_RECENT_RELEASE) break; // Only get first N_MOST_RECENT_RELEASE
            
            $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
            $title = null;
            $url = null;
            $rating = null;
            
            if ($posterDiv) {
                $url = $posterDiv->getAttribute('data-target-link');
                if ($url && strpos($url, 'http') !== 0) {
                    $url = 'https://letterboxd.com' . $url;
                }
                $img = $xpath->query('.//img', $posterDiv)->item(0);
                if ($img) {
                    $title = $img->getAttribute('alt');
                }
            }
            
            // Get rating
            $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
            $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
            
            // Include movie if we have title, url, and rating
            if ($title && $url && !empty($rating)) {
                $mostRecentReleaseMovies[] = [
                    'title' => $title,
                    'url' => $url,
                    'user_rating' => $rating
                ];
                $count++;
            }
        }
    }
}

// Now get the least recent release movies (from the last page of /films/)
$leastRecentReleaseMovies = [];
if ($totalPages > 0) {
    $lastReleasePageUrl = "https://letterboxd.com/$username/films/page/$totalPages/";
    
    $ch = curl_init($lastReleasePageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $leastRecentReleaseHtml = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 404 && $leastRecentReleaseHtml) {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($leastRecentReleaseHtml);
        $xpath = new DOMXPath($dom);

        $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
        if ($ul) {
            $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
            $allMoviesOnReleasePage = [];
            
            // Collect all movies from the last release page
            foreach ($liNodes as $li) {
                $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
                $title = null;
                $url = null;
                $rating = null;
                
                if ($posterDiv) {
                    $url = $posterDiv->getAttribute('data-target-link');
                    if ($url && strpos($url, 'http') !== 0) {
                        $url = 'https://letterboxd.com' . $url;
                    }
                    $img = $xpath->query('.//img', $posterDiv)->item(0);
                    if ($img) {
                        $title = $img->getAttribute('alt');
                    }
                }
                
                // Get rating
                $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
                $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
                
                // Include movie if we have title, url, and rating
                if ($title && $url && !empty($rating)) {
                    $allMoviesOnReleasePage[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating
                    ];
                }
            }
            
            // Get the last N_LEAST_RECENT_RELEASE movies with ratings from the page
            $leastRecentReleaseMovies = array_slice($allMoviesOnReleasePage, -N_LEAST_RECENT_RELEASE);
        }
    }
}

// Now get the best community rated movies (from /films/by/rating/)
$bestCommunityRateMovies = [];
$bestCommunityUrl = "https://letterboxd.com/$username/films/by/rating/";

$ch = curl_init($bestCommunityUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$bestCommunityHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 404 && $bestCommunityHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($bestCommunityHtml);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if ($ul) {
        $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
        $count = 0;
        
        foreach ($liNodes as $li) {
            if ($count >= N_BEST_COMMUNITY_RATE) break; // Only get first N_BEST_COMMUNITY_RATE
            
            $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
            $title = null;
            $url = null;
            $rating = null;
            
            if ($posterDiv) {
                $url = $posterDiv->getAttribute('data-target-link');
                if ($url && strpos($url, 'http') !== 0) {
                    $url = 'https://letterboxd.com' . $url;
                }
                $img = $xpath->query('.//img', $posterDiv)->item(0);
                if ($img) {
                    $title = $img->getAttribute('alt');
                }
            }
            
            // Get rating
            $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
            $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
            
            // Include movie if we have title, url, and rating
            if ($title && $url && !empty($rating)) {
                $bestCommunityRateMovies[] = [
                    'title' => $title,
                    'url' => $url,
                    'user_rating' => $rating
                ];
                $count++;
            }
        }
    }
}

// Now get the worst community rated movies (from the last page of /films/by/rating/)
$worstCommunityRateMovies = [];
if ($totalPages > 0) {
    $worstCommunityUrl = "https://letterboxd.com/$username/films/by/rating/page/$totalPages/";
    
    $ch = curl_init($worstCommunityUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $worstCommunityHtml = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 404 && $worstCommunityHtml) {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($worstCommunityHtml);
        $xpath = new DOMXPath($dom);

        $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
        if ($ul) {
            $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
            $allMoviesOnCommunityPage = [];
            
            // Collect all movies from the last community rating page
            foreach ($liNodes as $li) {
                $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
                $title = null;
                $url = null;
                $rating = null;
                
                if ($posterDiv) {
                    $url = $posterDiv->getAttribute('data-target-link');
                    if ($url && strpos($url, 'http') !== 0) {
                        $url = 'https://letterboxd.com' . $url;
                    }
                    $img = $xpath->query('.//img', $posterDiv)->item(0);
                    if ($img) {
                        $title = $img->getAttribute('alt');
                    }
                }
                
                // Get rating
                $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
                $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
                
                // Include movie if we have title, url, and rating
                if ($title && $url && !empty($rating)) {
                    $allMoviesOnCommunityPage[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating
                    ];
                }
            }
            
            // Get the last N_WORST_COMMUNITY_RATE movies with ratings from the page
            $worstCommunityRateMovies = array_slice($allMoviesOnCommunityPage, -N_WORST_COMMUNITY_RATE);
        }
    }
}

// Now get the best user rated movies (from /films/by/entry-rating/)
$bestUserRateMovies = [];
$bestUserUrl = "https://letterboxd.com/$username/films/by/entry-rating/";

$ch = curl_init($bestUserUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$bestUserHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 404 && $bestUserHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($bestUserHtml);
    $xpath = new DOMXPath($dom);

    $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
    if ($ul) {
        $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
        $count = 0;
        
        foreach ($liNodes as $li) {
            if ($count >= N_BEST_USER_RATE) break; // Only get first N_BEST_USER_RATE
            
            $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
            $title = null;
            $url = null;
            $rating = null;
            
            if ($posterDiv) {
                $url = $posterDiv->getAttribute('data-target-link');
                if ($url && strpos($url, 'http') !== 0) {
                    $url = 'https://letterboxd.com' . $url;
                }
                $img = $xpath->query('.//img', $posterDiv)->item(0);
                if ($img) {
                    $title = $img->getAttribute('alt');
                }
            }
            
            // Get rating
            $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
            $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
            
            // Include movie if we have title, url, and rating
            if ($title && $url && !empty($rating)) {
                $bestUserRateMovies[] = [
                    'title' => $title,
                    'url' => $url,
                    'user_rating' => $rating
                ];
                $count++;
            }
        }
    }
}

// Now get the worst user rated movies (from the last page of /films/by/entry-rating/)
$worstUserRateMovies = [];
if ($totalPages > 0) {
    $worstUserUrl = "https://letterboxd.com/$username/films/by/entry-rating/page/$totalPages/";
    
    $ch = curl_init($worstUserUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $worstUserHtml = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 404 && $worstUserHtml) {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($worstUserHtml);
        $xpath = new DOMXPath($dom);

        $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
        if ($ul) {
            $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
            $allMoviesOnUserPage = [];
            
            // Collect all movies from the last user rating page
            foreach ($liNodes as $li) {
                $posterDiv = $xpath->query('.//div[contains(@class, "film-poster")]', $li)->item(0);
                $title = null;
                $url = null;
                $rating = null;
                
                if ($posterDiv) {
                    $url = $posterDiv->getAttribute('data-target-link');
                    if ($url && strpos($url, 'http') !== 0) {
                        $url = 'https://letterboxd.com' . $url;
                    }
                    $img = $xpath->query('.//img', $posterDiv)->item(0);
                    if ($img) {
                        $title = $img->getAttribute('alt');
                    }
                }
                
                // Get rating
                $ratingSpan = $xpath->query('.//p[contains(@class, "poster-viewingdata")]/span[contains(@class, "rating")]', $li)->item(0);
                $rating = $ratingSpan ? trim($ratingSpan->textContent) : '';
                
                // Include movie if we have title, url, and rating
                if ($title && $url && !empty($rating)) {
                    $allMoviesOnUserPage[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating
                    ];
                }
            }
            
            // Get the last N_WORST_USER_RATE movies with ratings from the page
            $worstUserRateMovies = array_slice($allMoviesOnUserPage, -N_WORST_USER_RATE);
        }
    }
}

// Calculate execution time
$endTime = microtime(true);
$executionTime = round(($endTime - $startTime) * 1000, 2);

// Send final result with graph data
echo "data: " . json_encode([
    'type' => 'complete',
    'count' => count($movies),
    'total_movies' => $totalMovies,
    'total_pages' => $totalPages,
    'execution_time_ms' => $executionTime,
    'all_movies' => array_values($movies),
    'most_popular' => $popularMovies,
    'least_popular' => $leastPopularMovies,
    'most_recent_rated' => $recentMovies,
    'least_recent_rated' => $leastRecentMovies,
    'most_recent_release' => $mostRecentReleaseMovies,
    'least_recent_release' => $leastRecentReleaseMovies,
    'best_community_rate' => $bestCommunityRateMovies,
    'worst_community_rate' => $worstCommunityRateMovies,
    'best_user_rate' => $bestUserRateMovies,
    'worst_user_rate' => $worstUserRateMovies
]) . "\n\n";
?> 