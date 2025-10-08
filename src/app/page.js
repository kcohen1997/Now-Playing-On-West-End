import ShowList from "./ShowList";
import NodeCache from "node-cache";
import axios from "axios";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = new NodeCache({ stdTTL: 60 * 60 });
const BASE_URL = "https://www.londontheatre.co.uk";
const DEFAULT_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

// --- Helpers ---
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim().replace(/&amp;/g, "&");
  if (url.startsWith("//")) url = "https:" + url;
  if (url.startsWith("/")) url = "https://www.londontheatre.co.uk" + url;
  if (url.startsWith("http://")) url = url.replace("http://", "https://");
  if (!url.startsWith("https://"))
    url = "https://www.londontheatre.co.uk/" + url.replace(/^(\.\.\/)+/, "");
  return url;
}

async function validateImage(url) {
  if (!url) return null;
  try {
    const res = await axios.head(url);
    return res.status === 200 ? url : null;
  } catch {
    return null;
  }
}

// ---------- Static HTML Scraper ----------
async function getWestEndShowsStatic() {
  try {
    const { data } = await axios.get(`${BASE_URL}/whats-on`);
    const $ = cheerio.load(data);

    const shows = [];

    $("div[data-test-id^='poster-']").each((_, el) => {
      const posterDiv = $(el);

      // Show title
      const title =
        posterDiv.attr("data-test-id")?.replace("poster-", "") ||
        "Unknown Show";

      // Ticket URL
      const aTag = posterDiv.find("a").first();
      const url = aTag.attr("href") ? BASE_URL + aTag.attr("href") : null;

      // Poster image: desktop first, fallback to first source, else default
      let imgSrc =
        posterDiv
          .find('source[media="(min-width: 768px)"]')
          .first()
          .attr("srcset") ||
        posterDiv.find("source").first().attr("srcset") ||
        DEFAULT_IMG;

      if (imgSrc.includes(",")) {
        imgSrc = imgSrc.split(",")[0].trim();
      }

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
    console.error("Error fetching West End shows:", err.message);
    return [];
  }
}

// ---------- Wikipedia Scraper ----------
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
    const table = $("table.wikitable.sortable").first();
    if (!table.length) return [];

    table.find("tbody tr").each((_, el) => {
      const cells = $(el).find("td");
      if (cells.length < 5) return;

      const currentProductionRaw =
        $(cells[4]).text().trim() || $(cells[3]).text().trim();
      if (!currentProductionRaw || currentProductionRaw === "•") return;

      const currentProduction = currentProductionRaw
        .replace(/(\s)?\[\d+\]/g, "")
        .trim();

      // Wikipedia link from current production
      const linkElement = $(cells[4]).find("a").first();
      const wikiLink = linkElement?.attr("href")
        ? "https://en.wikipedia.org" + linkElement.attr("href")
        : null;

      // Table cell image (fallback before infobox)
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

// ---------- Get Infobox Image ----------
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

// ---------- Cached Data Fetcher ----------
async function getCachedShows() {
  const cached = cache.get("west-end-shows");
  if (cached) return cached;

  const [htmlShows, wikiShows] = await Promise.all([
    getWestEndShowsStatic(),
    getWestEndShowInfoFromWikipedia(),
  ]);

  const data = { htmlShows, wikiShows };
  if (htmlShows.length || wikiShows.length) cache.set("west-end-shows", data);
  return data;
}

// ---------- Main Page Component ----------
export default async function Page() {
  const stringSimilarity = (await import("string-similarity")).default;
  const { htmlShows, wikiShows } = await getCachedShows();

  const enrichedShows = await Promise.all(
    wikiShows.map(async (wikiShow) => {
      const normWikiTitle = normalizeTitle(wikiShow.title);

      // HTML exact match
      let matched = htmlShows.find(
        (s) => normalizeTitle(s.title) === normWikiTitle
      );

      // Fallback: best similarity match
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
        if (bestScore > 0.7) matched = bestMatch;
      }

      // Image logic: HTML > Wikipedia table cell > Wikipedia infobox > default
      let imgSrc = matched?.imgSrc || wikiShow.wikiImg || null;
      if (!imgSrc && wikiShow.wikiLink) {
        imgSrc = await getWikiInfoboxImage(wikiShow.wikiLink);
      }
      imgSrc = await validateImage(imgSrc);
      if (!imgSrc) imgSrc = DEFAULT_IMG;

      // Link logic: Wikipedia page > HTML show link
      const link = matched?.url || wikiShow.wikiLink || "#";

      return {
        ...wikiShow,
        link,
        imgSrc,
      };
    })
  );

  if (enrichedShows.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-10">
        No West End shows found at this time.
      </p>
    );
  }

  return <ShowList shows={enrichedShows} />;
}
