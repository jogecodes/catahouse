<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Constants for number of movies to get
define('N_LEAST_POPULAR', 5);

function convertRatingToScore($rating) {
    $ratingMap = [
        '★★★★★' => 5.0,
        '★★★★½' => 4.5,
        '★★★★' => 4.0,
        '★★★½' => 3.5,
        '★★★' => 3.0,
        '★★½' => 2.5,
        '★★' => 2.0,
        '★½' => 1.5,
        '★' => 1.0,
        '½' => 0.5
    ];
    return isset($ratingMap[$rating]) ? $ratingMap[$rating] : 0.0;
}

function calculateDissidentScore($userScore, $communityPosition, $totalPositions) {
    $expectedScore = 5 - (4 * ($communityPosition - 1) / ($totalPositions - 1));
    $dissidentScore = $userScore - $expectedScore;
    return round($dissidentScore, 2);
}

$username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['username']); // sanitize

// Validate username
if (empty($username)) {
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => 'Invalid username provided'
    ]) . "\n\n";
    exit;
}

$baseUrl = "https://letterboxd.com/$username/films/by/rating/";

// First, get the total number of movies with ratings
$countUrl = "https://letterboxd.com/$username/";
$ch = curl_init($countUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Increased timeout
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
$countHtml = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$totalMovies = 0;
if ($http_code !== 404 && $countHtml) {
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    $dom->loadHTML($countHtml);
    $xpath = new DOMXPath($dom);
    
    // Look for the ratings section and extract the count
    $ratingLinks = $xpath->query('//a[contains(@href, "/films/by/entry-rating/")]');
    if ($ratingLinks->length > 0) {
        foreach ($ratingLinks as $link) {
            $text = trim($link->textContent);
            if (preg_match('/([\d,]+)/', $text, $matches)) {
                $totalMovies = (int)str_replace(',', '', $matches[1]);
                break;
            }
        }
    }
    
    // Fallback logic if not found in link text
    if ($totalMovies === 0) {
        $ratingsSection = $xpath->query('//section[contains(@class, "ratings-histogram-chart")]');
        if ($ratingsSection->length > 0) {
            $sectionText = $ratingsSection->item(0)->textContent;
            if (preg_match('/([\d,]+)\s+films?\s+rated/i', $sectionText, $matches)) {
                $totalMovies = (int)str_replace(',', '', $matches[1]);
            }
        }
    }
    
    if ($totalMovies === 0) {
        if (preg_match('/([\d,]+)\s+films?\s+watched/i', $countHtml, $matches)) {
            $totalMovies = (int)str_replace(',', '', $matches[1]);
        }
    }
    
    // Additional fallback: look for any number followed by "films" or "films watched"
    if ($totalMovies === 0) {
        if (preg_match('/([\d,]+)\s+films?\s+watched/i', $countHtml, $matches)) {
            $totalMovies = (int)str_replace(',', '', $matches[1]);
        } elseif (preg_match('/([\d,]+)\s+films?/i', $countHtml, $matches)) {
            $totalMovies = (int)str_replace(',', '', $matches[1]);
        }
    }
    
    // Debug: Send the HTML sample to see what we're working with
    if ($totalMovies === 0) {
        echo "data: " . json_encode([
            'type' => 'error',
            'error' => "Could not extract movie count. HTML sample: " . substr($countHtml, 0, 500)
        ]) . "\n\n";
        exit;
    }
    
    // Debug: Send error if no movies found
    if ($totalMovies === 0) {
        echo "data: " . json_encode([
            'type' => 'error',
            'error' => "No movies found for user '$username'. User might not exist or have no rated movies."
        ]) . "\n\n";
        exit;
    }
    
    // Debug: Send what we found
    echo "data: " . json_encode([
        'type' => 'progress',
        'progress' => 5,
        'message' => "Found $totalMovies movies for user '$username'"
    ]) . "\n\n";
} else {
    // Debug: Send error if profile not found
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => "Profile not found for user '$username' (HTTP $http_code)"
    ]) . "\n\n";
    exit;
}

// Send initial progress
echo "data: " . json_encode([
    'type' => 'progress',
    'progress' => 5,
    'message' => 'Starting analysis...',
    'total_movies' => $totalMovies
]) . "\n\n";



// Now get all movies with ratings (this will be our main dataset)
$movies = [];
$page = 1;
$totalPages = 0;
$currentProgress = 0;
$position = 1; // Counter for community rating position
$leastPopularMovies = [];

// Calculate total pages based on 72 movies per page
$totalPages = ceil($totalMovies / 72);

// Limit pages for users with too many movies to avoid timeouts
if ($totalPages > 20) {
    $totalPages = 20; // Limit to 20 pages (1440 movies max)
    echo "data: " . json_encode([
        'type' => 'progress',
        'progress' => 5,
        'message' => "User has $totalMovies movies. Limiting to first 1440 movies to avoid timeouts."
    ]) . "\n\n";
}

// Debug: Send error if no pages calculated
if ($totalPages === 0) {
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => "Error calculating pages for $totalMovies movies"
    ]) . "\n\n";
    exit;
}



while ($page <= $totalPages) {
    
    
    $url = $baseUrl . ($page > 1 ? "page/$page/" : "");
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Increased timeout for large users
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    

    
    if ($http_code !== 404 && $html) {

        
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($html);
        $xpath = new DOMXPath($dom);
        
        $ul = $xpath->query('//ul[contains(@class, "poster-list")]')->item(0);
        if ($ul) {

            $liNodes = $xpath->query('.//li[contains(@class, "poster-container")]', $ul);
            

            
            $movieCount = 0;
            

            
            foreach ($liNodes as $li) {
                $movieCount++;
                

                

                
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
                
                // Include movie if we have title and url (rating is guaranteed)
                if ($title && $url) {
                    $userScore = convertRatingToScore($rating);
                    $expectedScore = 5 - (4 * ($position - 1) / ($totalMovies - 1));
                    $dissidentScore = $userScore - $expectedScore;
                    
                    $movies[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating,
                        'user_score' => $userScore,
                        'community_position' => $position,
                        'expected_score' => round($expectedScore, 2),
                        'dissident_score' => round($dissidentScore, 2)
                    ];
                    $position++;
                    

                    
                    // Send progress update every 10 movies to slow down the progress
                    if ($position % 10 === 0) {
                        $progress = 5 + (($position / $totalMovies) * 85); // 5% to 90%
                        echo "data: " . json_encode([
                            'type' => 'progress',
                            'progress' => round($progress),
                            'message' => "Processing movie $position of $totalMovies"
                        ]) . "\n\n";
                    } else {
                        // Send small progress updates for continuous feedback
                        $progress = 5 + (($position / $totalMovies) * 85);
                        if ($position % 5 === 0) { // Every 5 movies
                            echo "data: " . json_encode([
                                'type' => 'progress',
                                'progress' => round($progress),
                                'message' => "Processing movie $position of $totalMovies"
                            ]) . "\n\n";
                        }
                    }
                }
            }
        }
    }
    
    // Update progress (5% to 90% - slower progression)
    $progress = 5 + (($page / $totalPages) * 85);
    if ($progress > $currentProgress + 2) { // More frequent updates
        $currentProgress = $progress;
        echo "data: " . json_encode([
            'type' => 'progress',
            'progress' => round($progress),
            'message' => "Analyzing page $page of $totalPages"
        ]) . "\n\n";
    } else {
        // Send progress update even if small increment to show continuous progress
        echo "data: " . json_encode([
            'type' => 'progress',
            'progress' => round($progress),
            'message' => "Analyzing page $page of $totalPages"
        ]) . "\n\n";
    }
    
    // Add delay between requests to avoid rate limiting
    if ($page < $totalPages) {
        usleep(100000); // 0.1 second delay
    }
    
    $page++;
}

// Debug: Check if we found any movies
if (count($movies) === 0) {
    echo "data: " . json_encode([
        'type' => 'error',
        'error' => "No movies found after processing all pages for user '$username'"
    ]) . "\n\n";
    exit;
}



// Now get the least popular movies (from the last page of /films/by/popular/)
$leastPopularMovies = [];
if ($totalPages > 0) {
    $leastPopularUrl = "https://letterboxd.com/$username/films/by/popular/page/$totalPages/";
    
    $ch = curl_init($leastPopularUrl);
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
            $allMoviesOnPopularPage = [];
            
            // Collect all movies from the last popular page
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
                    $allMoviesOnPopularPage[] = [
                        'title' => $title,
                        'url' => $url,
                        'user_rating' => $rating,
                        'user_score' => convertRatingToScore($rating)
                    ];
                }
            }
            
            // Get the last N_LEAST_POPULAR movies with ratings from the page
            $leastPopularMovies = array_slice($allMoviesOnPopularPage, -N_LEAST_POPULAR);
            
            // Add dissident scores to least popular movies with progress updates
            foreach ($leastPopularMovies as $index => &$movie) {
                $userScore = $movie['user_score'];
                $expectedScore = 5 - (4 * ($index) / (N_LEAST_POPULAR - 1));
                $dissidentScore = $userScore - $expectedScore;
                
                $movie['community_position'] = $totalMovies - N_LEAST_POPULAR + $index + 1;
                $movie['expected_score'] = round($expectedScore, 2);
                $movie['dissident_score'] = round($dissidentScore, 2);
                
                // Send progress update for each least popular movie
                $progress = 90 + (($index + 1) / N_LEAST_POPULAR) * 10; // 90% to 100%
                echo "data: " . json_encode([
                    'type' => 'progress',
                    'progress' => round($progress),
                    'message' => "Processing least popular movie " . ($index + 1) . " of " . N_LEAST_POPULAR
                ]) . "\n\n";
                
                // Add small delay to show progress
                usleep(100000); // 0.1 second delay
            }
        }
    }
}

// Send final data with all movies
echo "data: " . json_encode([
    'type' => 'complete',
    'progress' => 100,
    'username' => $username,
    'total_movies' => $totalMovies,
    'all_movies' => $movies,
    'least_popular' => $leastPopularMovies
]) . "\n\n";
?> 