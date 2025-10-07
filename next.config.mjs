/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "www.londontheatre.co.uk",    // main site
      "images.londontheatre.co.uk", // poster images hosted separately
      "upload.wikimedia.org",       // Wikipedia fallback/default images
      "images.ctfassets.net",       // Broadway/production assets
      "cdn.london-theatre.co.uk",   // sometimes used for posters
      "media.timeout.com",          // occasional media images
      "www.broadwayworld.com",      // if linked from scraper
      "www.ticketmaster.co.uk",     // ticketing images
    ],
  },
};

export default nextConfig;
