import axios from "axios";
import * as cheerio from "cheerio";
import NodeCache from "node-cache";
import ShowList from "./ShowList";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = new NodeCache({ stdTTL: 60 * 60 });

// --- Helpers ---
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function serializeDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return isNaN(d) ? "N/A" : d.toISOString().split("T")[0];
}

function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (url.startsWith("//")) url = "https:" + url;
  if (url.startsWith("/")) url = "https://www.londontheatre.co.uk" + url;
  if (url.startsWith("http://")) url = url.replace("http://", "https://");
  if (!url.startsWith("https://"))
    url = "https://www.londontheatre.co.uk/" + url.replace(/^(\.\.\/)+/, "");
  return url;
}

// ---------- Static HTML Scraper (No Puppeteer) ----------
async function getWestEndShowsStatic() {
  try {
    const { data } = await axios.get(
      "https://www.londontheatre.co.uk/whats-on",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    const $ = cheerio.load(data);
    const shows = [];

    $("#product-list-grid-3 .MuiGrid-item").each((_, el) => {
      const anchor = $(el).find("a").first();
      const link = anchor.attr("href")
        ? normalizeUrl(anchor.attr("href"))
        : null;

      const titleAttr = $(el).find("[data-test-id]").attr("data-test-id");
      const title = titleAttr
        ? titleAttr.replace("poster-", "").trim()
        : $(el).find("img").attr("alt") || null;

      // --- Extract image URL ---
      let imgSrc =
        $(el).find("img").attr("src") ||
        $(el).find("img").attr("data-src") ||
        $(el).find("source").last().attr("srcset") ||
        null;

      if (imgSrc) imgSrc = normalizeUrl(imgSrc);

      if (title && link) {
        shows.push({ title, link, imgSrc });
      }
    });

    return shows;
  } catch (err) {
    console.error("❌ Failed to fetch West End shows:", err.message);
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
      const theaterName = $(el).find("th").text().trim();
      const cells = $(el).find("td");
      if (!theaterName || cells.length < 5) return;

      const currentProductionRaw =
        $(cells[4]).text().trim() || $(cells[3]).text().trim();
      const type = $(cells[5]).text().trim() || "Unknown";
      const opening = $(cells[6]).text().trim();
      const closing = $(cells[7]).text().trim();

      if (!currentProductionRaw || currentProductionRaw === "•") return;

      const currentProduction = currentProductionRaw
        .replace(/(\s)?\[\d+\]/g, "")
        .trim();

      shows.push({
        title: currentProduction,
        theaterName,
        type,
        openingdate: serializeDate(
          opening.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || opening
        ),
        closingdate:
          closing === "Open-ended"
            ? "Open-ended"
            : serializeDate(
                closing.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || closing
              ),
      });
    });

    return shows;
  } catch (err) {
    console.error("❌ Failed to fetch West End show info from Wikipedia:", err);
    return [];
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

  const DEFAULT_IMG =
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

  const enrichedShows = wikiShows.map((wikiShow) => {
    const normWikiTitle = normalizeTitle(wikiShow.title);
    let matched = htmlShows.find((s) =>
      normalizeTitle(s.title).includes(normWikiTitle)
    );

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
      if (bestScore > 0.6) matched = bestMatch;
    }

    return {
      ...wikiShow,
      link: matched?.link || null,
      imgSrc: matched?.imgSrc || DEFAULT_IMG,
    };
  });

  if (enrichedShows.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-10">
        No West End shows found at this time.
      </p>
    );
  }

  return <ShowList shows={enrichedShows} />;
}
