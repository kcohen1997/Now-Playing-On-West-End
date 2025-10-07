import fs from "fs";
import puppeteer from "puppeteer";
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

// ---------- Puppeteer Scraper ----------
async function getWestEndShows() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    );

    console.log("🔄 Navigating to LondonTheatre.co.uk...");
    await page.goto("https://www.londontheatre.co.uk/whats-on", { waitUntil: "networkidle2" });

    // Scroll multiple times to load lazy images
    await page.evaluate(async () => {
      const distance = 1000;
      const delay = 1000;
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, distance);
        await new Promise((res) => setTimeout(res, delay));
      }
    });

    await page.waitForSelector("#product-list-grid-3");

    const html = await page.content();
    await fs.promises.writeFile("/tmp/theatre_snapshot.html", html);

    // --- Extract shows ---
    const { shows, debug } = await page.evaluate(() => {
      // getImage must be defined inside evaluate
      function getImage(el) {
        const imgEl = el.querySelector("img");
        if (imgEl) {
          const url =
            imgEl.currentSrc ||
            imgEl.src ||
            imgEl.dataset?.src ||
            imgEl.dataset?.lazySrc ||
            imgEl.dataset?.srcset?.split(",").pop().trim().split(" ")[0] ||
            null;
          if (url) return { url, method: "img" };
        }

        const sources = el.querySelectorAll("picture source[srcset]");
        if (sources.length > 0) {
          const srcset = sources[sources.length - 1].getAttribute("srcset");
          if (srcset) {
            const urls = srcset
              .split(/\s*,\s*/)
              .map((s) => s.trim().split(" ")[0])
              .filter(Boolean);
            if (urls.length > 0) return { url: urls[0], method: "srcset" };
          }
        }

        const inlineBg = el.querySelector("[style*='background-image']")?.style.backgroundImage;
        if (inlineBg) {
          return {
            url: inlineBg.replace(/^url\(["']?/, "").replace(/["']?\)$/, ""),
            method: "inline-bg",
          };
        }

        const compBg = getComputedStyle(el).backgroundImage;
        if (compBg && compBg !== "none") {
          return {
            url: compBg.replace(/^url\(["']?/, "").replace(/["']?\)$/, ""),
            method: "computed-bg",
          };
        }

        return { url: null, method: "none" };
      }

      const items = Array.from(document.querySelectorAll("#product-list-grid-3 .MuiGrid-item"));
      const debug = [];
      const shows = items
        .map((el) => {
          const anchor = el.querySelector("a");
          const link = anchor ? anchor.href : null;
          const titleAttr = el.querySelector("[data-test-id]")?.getAttribute("data-test-id");
          const title = titleAttr ? titleAttr.replace("poster-", "").trim() : null;
          const imgData = getImage(el);
          if (!title || !link) return null;
          debug.push({ title, imgSrc: imgData.url, method: imgData.method });
          return { title, link, imgSrc: imgData.url };
        })
        .filter(Boolean);

      return { shows, debug };
    });

    // Normalize URLs
    shows.forEach((s) => (s.imgSrc = normalizeUrl(s.imgSrc)));
    debug.forEach((d) => { if (!d.imgSrc) console.warn(`⚠️ Missing image for "${d.title}"`); });

    return shows;
  } catch (err) {
    console.error("❌ Failed to fetch West End shows:", err);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// ---------- Wikipedia Scraper ----------
async function getWestEndShowInfoFromWikipedia() {
  try {
    const res = await axios.get("https://en.wikipedia.org/wiki/West_End_theatre", {
      headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9" },
    });

    const $ = cheerio.load(res.data);
    const shows = [];
    const table = $("table.wikitable.sortable").first();
    if (!table.length) return [];

    table.find("tbody tr").each((_, el) => {
      const theaterName = $(el).find("th").text().trim();
      const cells = $(el).find("td");
      if (!theaterName || cells.length < 5) return;

      const currentProductionRaw = $(cells[4]).text().trim() || $(cells[3]).text().trim();
      const type = $(cells[5]).text().trim() || "Unknown";
      const opening = $(cells[6]).text().trim();
      const closing = $(cells[7]).text().trim();

      if (!currentProductionRaw || currentProductionRaw === "•") return;

      const currentProduction = currentProductionRaw.replace(/(\s)?\[\d+\]/g, "").trim();

      shows.push({
        title: currentProduction,
        theaterName,
        type,
        openingdate: serializeDate(opening.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || opening),
        closingdate: closing === "Open-ended"
          ? "Open-ended"
          : serializeDate(closing.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || closing),
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

  const [puppetShows, wikiShows] = await Promise.all([
    getWestEndShows(),
    getWestEndShowInfoFromWikipedia(),
  ]);

  const data = { puppetShows, wikiShows };
  cache.set("west-end-shows", data);
  return data;
}

// ---------- Main Page Component ----------
export default async function Page() {
  const stringSimilarity = (await import("string-similarity")).default;
  const { puppetShows, wikiShows } = await getCachedShows();

  const DEFAULT_IMG = "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

  const enrichedShows = wikiShows.map((wikiShow) => {
    const normWikiTitle = normalizeTitle(wikiShow.title);
    let matchedPuppet = puppetShows.find((ps) =>
      normalizeTitle(ps.title).includes(normWikiTitle)
    );

    if (!matchedPuppet) {
      let bestMatch = null;
      let highestScore = 0;
      for (const ps of puppetShows) {
        const similarity = stringSimilarity.compareTwoStrings(
          normalizeTitle(ps.title),
          normWikiTitle
        );
        if (similarity > highestScore) {
          highestScore = similarity;
          bestMatch = ps;
        }
      }
      if (highestScore > 0.6) matchedPuppet = bestMatch;
    }

    return {
      ...wikiShow,
      link: matchedPuppet?.link || null,
      imgSrc: matchedPuppet?.imgSrc || DEFAULT_IMG,
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
