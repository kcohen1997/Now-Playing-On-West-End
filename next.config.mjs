/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "www.londontheatre.co.uk", // Puppeteer scraped images
      "images.londontheatre.co.uk", // Sometimes used for posters
      "upload.wikimedia.org", // Wikipedia fallback/default images
      "images.ctfassets.net", // New domain causing the error
    ],
  },
};

export default nextConfig;
