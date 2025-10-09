import ShowList from "./ShowList"; // Component to render list of shows
import NodeCache from "node-cache"; // Simple in-memory caching
import axios from "axios"; // HTTP client for fetching pages
import * as cheerio from "cheerio"; // jQuery-like HTML parser

// ---------- Page configuration ----------
export const dynamic = "force-dynamic"; // Forces server-side rendering
export const runtime = "nodejs"; // Ensures Node.js runtime (needed for axios & cheerio)

// ---------- Cache & constants ----------
const cache = new NodeCache({ stdTTL: 60 * 60 }); // Cache with 1 hour TTL
const BASE_URL = "https://www.londontheatre.co.uk"; // Base URL for relative links
const DEFAULT_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg"; // Fallback image

// ---------- Helper functions ----------

// Normalize show titles for comparison (remove punctuation, lowercase, trim)
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize URLs, resolve relative paths
function normalizeUrl(url) {
  if (!url) return null;
  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return null;
  }
}

// Check if image exists by sending HEAD request
async function validateImage(url) {
  if (!url) return null;
  try {
    const res = await axios.head(url);
    return res.status === 200 ? url : null;
  } catch {
    return null;
  }
}

// Static HTML Scraper for West End shows
async function getWestEndShowsStatic() {
  try {
    const { data } = await axios.get(`${BASE_URL}/whats-on?today=true`);
    const $ = cheerio.load(data);

    const shows = [];

    // Loop through poster divs
    $("div[data-test-id^='poster-']").each((_, el) => {
      const posterDiv = $(el);

      const title =
        posterDiv.attr("data-test-id")?.replace("poster-", "") ||
        "Unknown Show"; // Fallback title

      // Grab first anchor tag for show link
      const aTag = posterDiv.find("a").first();
      const url = aTag.attr("href")
        ? normalizeUrl(BASE_URL + aTag.attr("href"))
        : null;

      // Grab responsive image (desktop first, then default)
      let imgSrc =
        posterDiv
          .find('source[media="(min-width: 768px)"]')
          .first()
          .attr("srcset") ||
        posterDiv.find("source").first().attr("srcset") ||
        DEFAULT_IMG;

      // Take only first image if multiple are provided
      if (imgSrc.includes(",")) imgSrc = imgSrc.split(",")[0].trim();

      // Push show object
      shows.push({
        title,
        url,
        imgSrc,
        type: null,
        venue: null,
        openingdate: null,
        closingdate: null,
      });
    });

    return shows;
  } catch (err) {
    console.error("❌ Error fetching West End shows:", err.message);
    return [];
  }
}

// Wikipedia Scraper for additional show info
async function getWestEndShowInfoFromWikipedia() {
  try {
    const res = await axios.get(
      "https://en.wikipedia.org/wiki/West_End_theatre",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    const $ = cheerio.load(res.data);
    const shows = [];
    const table = $("table.wikitable.sortable").first(); // Grab first sortable wikitable
    if (!table.length) return [];

    table.find("tbody tr").each((_, el) => {
      const cells = $(el).find("td");
      if (cells.length < 5) return; // Skip invalid rows

      const currentProductionRaw =
        $(cells[4]).text().trim() || $(cells[3]).text().trim();
      if (!currentProductionRaw || currentProductionRaw === "•") return;

      const currentProduction = currentProductionRaw
        .replace(/(\s)?\[\d+\]/g, "") // Remove citations like [1], [2]
        .trim();

      const linkElement = $(cells[4]).find("a").first();
      const wikiLink = linkElement?.attr("href")
        ? normalizeUrl("https://en.wikipedia.org" + linkElement.attr("href"))
        : null;

      const imgElement = $(cells[4]).find("img").first();
      let wikiImg = imgElement?.attr("src") || null;
      if (wikiImg && wikiImg.startsWith("//")) wikiImg = "https:" + wikiImg;

      shows.push({
        title: currentProduction,
        type: $(cells[5]).text().trim() || "Unknown",
        openingdate: $(cells[6]).text().trim() || "N/A",
        closingdate: $(cells[7]).text().trim() || "N/A",
        wikiImg: wikiImg || null,
        wikiLink,
      });
    });

    return shows;
  } catch (err) {
    console.error("❌ Failed to fetch Wikipedia show info:", err);
    return [];
  }
}

// Wikipedia Image Fetcher
async function getWikiInfoboxImage(wikiLink) {
  if (!wikiLink) return null;
  try {
    const { data } = await axios.get(wikiLink, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(data);
    const infoboxImg = $(".infobox-image img").first();
    if (!infoboxImg.length) return null;

    let src = infoboxImg.attr("src");
    if (!src) return null;
    if (src.startsWith("//")) src = "https:" + src;
    return src;
  } catch (err) {
    console.error("❌ Failed to fetch Wikipedia infobox image:", err.message);
    return null;
  }
}

// Cached Data Fetcher
async function getCachedShows() {
  const cached = cache.get("west-end-shows");
  if (cached) return cached; // Return if cache exists

  // Fetch both sources in parallel
  const [htmlShows, wikiShows] = await Promise.all([
    getWestEndShowsStatic(),
    getWestEndShowInfoFromWikipedia(),
  ]);

  const data = { htmlShows, wikiShows };
  if (htmlShows.length || wikiShows.length) cache.set("west-end-shows", data);
  return data;
}

// ---------- Enrich Wikipedia Show with HTML info ----------
async function enrichShow(wikiShow, htmlShows, stringSimilarity) {
  const normWikiTitle = normalizeTitle(wikiShow.title);

  // Try exact title match
  let matched = htmlShows.find(
    (s) => normalizeTitle(s.title) === normWikiTitle
  );

  // If no exact match, find best similarity match
  if (!matched) {
    let bestMatch = null;
    let bestScore = 0;
    for (const s of htmlShows) {
      const score = stringSimilarity.compareTwoStrings(
        normalizeTitle(s.title),
        normWikiTitle
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatch = s;
      }
    }
    if (bestScore > 0.9) matched = bestMatch;
  }

  // Skip shows not found on HTML page
  if (!matched) return null;

  // Determine best image: HTML > Wikipedia table > Wikipedia infobox > default
  let imgSrc = matched?.imgSrc || wikiShow.wikiImg || null;
  if (!imgSrc && wikiShow.wikiLink) {
    imgSrc = await getWikiInfoboxImage(wikiShow.wikiLink);
  }
  imgSrc = await validateImage(imgSrc);
  if (!imgSrc) imgSrc = DEFAULT_IMG;

  // Determine best link: HTML > Wikipedia
  const link =
    normalizeUrl(matched?.url) || normalizeUrl(wikiShow.wikiLink) || "#";

  return {
    ...wikiShow,
    link,
    imgSrc,
  };
}

export default async function Page() {
  const stringSimilarity = (await import("string-similarity")).default;
  const pLimit = (await import("p-limit")).default;
  const limit = pLimit(5); // Limit concurrency to 5

  const { htmlShows, wikiShows } = await getCachedShows();

  // Enrich each Wikipedia show with HTML data concurrently
  const enrichedShowsResults = await Promise.allSettled(
    wikiShows.map((wikiShow) =>
      limit(() => enrichShow(wikiShow, htmlShows, stringSimilarity))
    )
  );

  const enrichedShows = enrichedShowsResults
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  // If no shows found, show fallback message
  if (enrichedShows.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-10">
        No West End shows found at this time.
      </p>
    );
  }

  // Render ShowList component with enriched shows
  return <ShowList shows={enrichedShows} />;
}
