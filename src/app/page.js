import axios from "axios";
import * as cheerio from "cheerio";
import stringSimilarity from "string-similarity";
import ShowList from "./ShowList";

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getBroadwayShows() {
  try {
    const res = await axios.get("https://playbill.com/shows/broadway", {
      headers: {
        "User-Agent": "Mozilla/5.0 ...",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(res.data);
    const shows = [];

    $("div.show-container").each((i, el) => {
      const title = $(el).find("div.prod-title").text().trim();
      const link = $(el).find("div.prod-title a").attr("href");
      if (!title || !link) return;

      let imgSrc = null;
      const imgEl = $(el).find("div.cover-container a img").first();
      if (imgEl.length) {
        imgSrc = imgEl.attr("src");
        if (imgSrc && imgSrc.startsWith("//")) {
          imgSrc = "https:" + imgSrc;
        }
      }

      shows.push({ title, imgSrc, link});
    });

    return shows;
  } catch (err) {
    console.error("Failed to fetch Broadway shows:", err);
    return [];
  }
}

async function getBroadwayShowTypeFromWikipedia() {
  try {
    const res = await axios.get("https://en.wikipedia.org/wiki/Broadway_theatre", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(res.data);
    const shows = [];

    const table = $("table.wikitable").first();
    table.find("tbody tr").slice(1).each((i, el) => {
      const theater = $(el).find("th");
      const theaterName = $(theater).text().trim();
      const cells = $(el).find("td");
      if (cells.length < 7) return;

      const currentProductionRaw = $(cells[3]).text().trim();
      const currentProduction = currentProductionRaw.replace(/(\s)?\[\d+\]/g, "").trim();
      const type = $(cells[4]).text().trim();
      const opening = $(cells[5]).text().trim();
      const closing = $(cells[6]).text().trim();

      if (!theaterName || !currentProduction || !type || !opening || !closing) return;

      shows.push({ theaterName, currentProduction, type, opening, closing });
    });

    return shows;
  } catch (err) {
    console.error("Failed to fetch Broadway shows from Wikipedia:", err);
    return [];
  }
}

export default async function Page() {
  const [shows, showTypes] = await Promise.all([
    getBroadwayShows(),
    getBroadwayShowTypeFromWikipedia(),
  ]);

  const enrichedShows = shows.map((show) => {
    const normTitle = normalizeTitle(show.title);

    let matched = showTypes.find((wikiShow) =>
      normalizeTitle(wikiShow.currentProduction).includes(normTitle)
    );

    if (!matched) {
      let bestMatch = null;
      let highestScore = 0;
      for (const wikiShow of showTypes) {
        const similarity = stringSimilarity.compareTwoStrings(
          normTitle,
          normalizeTitle(wikiShow.currentProduction)
        );
        if (similarity > highestScore) {
          highestScore = similarity;
          bestMatch = wikiShow;
        }
      }
      if (highestScore > 0.6) {
        matched = bestMatch;
      }
    }

    return {
      ...show,
      type: matched ? matched.type : "Unknown",
      openingdate: matched.opening.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ? new Date(matched.opening.match(/^\d{4}-\d{2}-\d{2}/)?.[0]) : "N/A",
      closingdate: matched.closing == "Open-ended" ? "Open-ended" :  matched.closing.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ? new Date(matched.closing.match(/^\d{4}-\d{2}-\d{2}/)?.[0]) : "N/A"
    };
  });

  return <ShowList shows={enrichedShows} />;
}
