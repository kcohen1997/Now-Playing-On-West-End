"use client";

import { useState, useEffect, useMemo } from "react";

const DEFAULT_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

export default function ShowList({ shows }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("a-z");
  const [showPreviewsOnly, setShowPreviewsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState("light");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => setTheme(e.matches ? "dark" : "light");
    const handleResize = () => setIsMobile(window.innerWidth < 640);

    setTheme(media.matches ? "dark" : "light");
    handleResize();

    media.addEventListener("change", handleThemeChange);
    window.addEventListener("resize", handleResize);

    return () => {
      media.removeEventListener("change", handleThemeChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ----------------- Date Parsing -----------------
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A" || dateStr === "Open-ended") return null;
    dateStr = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const mYMatch = dateStr.match(/([A-Za-z]+)\s+(\d{4})/);
    if (mYMatch) {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const month = months.indexOf(mYMatch[1]) ?? 0;
      const year = parseInt(mYMatch[2]);
      return new Date(year, month, 1);
    }
    const yearMatch = dateStr.match(/\d{4}/);
    if (yearMatch) return new Date(parseInt(yearMatch[0]), 0, 1);
    return null;
  };

  const formatDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return dateStr || "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isInPreviews = (dateStr) => {
    const d = parseDate(dateStr);
    return d && d > now;
  };

  // ----------------- Filtering & Sorting -----------------
  const filteredShows = useMemo(() => {
    return shows
      .filter((show) => {
        const type = (show.type || show.category || "").toLowerCase();

        if (filter !== "All") {
          if (filter === "Musical" && !type.includes("musical")) return false;
          if (filter === "Play" && !type.includes("play")) return false;
          if (
            filter === "Other" &&
            ["musical", "play"].some((t) => type.includes(t))
          )
            return false;
        }

        if (showPreviewsOnly && !isInPreviews(show.openingdate)) return false;

        if (
          searchTerm &&
          !show.title
            .toLowerCase()
            .replace(/\s+/g, " ")
            .includes(searchTerm.toLowerCase().trim())
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = parseDate(a.openingdate) || 8640000000000000;
        const dateB = parseDate(b.openingdate) || 8640000000000000;
        switch (sort) {
          case "a-z":
            return a.title.localeCompare(b.title);
          case "z-a":
            return b.title.localeCompare(a.title);
          case "opening-earliest":
            return dateA - dateB;
          case "opening-latest":
            return dateB - dateA;
          default:
            return 0;
        }
      });
  }, [shows, filter, sort, showPreviewsOnly, searchTerm, now]);

  const darkMode = theme === "dark";

  // ----------------- Render -----------------
  return (
    <div
      className={`flex flex-col min-h-screen font-sans ${
        darkMode
          ? "bg-gray-900 text-gray-100"
          : "bg-gradient-to-b from-pink-50 to-pink-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <header className="flex flex-col items-center p-4 md:flex-row md:justify-between md:px-12">
        <h1
          className={`text-2xl md:text-4xl font-bold text-center md:text-left ${
            darkMode ? "text-white-300" : "text-gray-900"
          }`}
        >
          Now Playing in London’s West End
        </h1>
        <button
          onClick={() => setTheme(darkMode ? "light" : "dark")}
          aria-label="Toggle dark/light mode"
          className={`mt-4 md:mt-0 px-4 py-2 rounded-lg font-semibold cursor-pointer transition-transform duration-200 ${
            darkMode
              ? "bg-pink-300 text-black hover:scale-105"
              : "bg-red-600 text-white hover:scale-105"
          }`}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      {/* Controls */}
      {/* Controls */}
      <div className="sticky top-0 z-20 bg-white px-4 md:px-8 py-3 md:py-4 border-b border-gray-300 flex flex-col sm:flex-col md:flex-row flex-wrap gap-2 sm:gap-2 md:gap-3 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full md:w-36 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
        >
          <option value="All">All Shows</option>
          <option value="Musical">Musicals</option>
          <option value="Play">Plays</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full md:w-36 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"
        >
          <option value="a-z">Sort A–Z</option>
          <option value="z-a">Sort Z–A</option>
          <option value="opening-earliest">Earliest</option>
          <option value="opening-latest">Latest</option>
        </select>

        <label className="flex items-center gap-2 text-gray-900">
          <input
            type="checkbox"
            checked={showPreviewsOnly}
            onChange={(e) => setShowPreviewsOnly(e.target.checked)}
            className="w-4 h-4"
          />
          Previews only
        </label>

        <input
          type="text"
          placeholder="Search by title..."
          aria-label="Search shows by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-900"
        />
      </div>

      {/* Show Grid */}
      <ul className="grid gap-4 px-4 md:px-12 mb-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center mt-6">
        {filteredShows.length > 0 ? (
          filteredShows.map((show, index) => {
            const inPreviews = isInPreviews(show.openingdate);
            return (
              <li
                key={index}
                className="w-full max-w-[280px] flex flex-col relative"
              >
                <a
                  href={show.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col h-full rounded-lg overflow-hidden shadow-lg transform transition hover:scale-105 relative"
                >
                  {/* Diagonal Ribbon */}
                  {inPreviews && (
                    <div className="absolute top-3 right-[-35px] w-28 text-center bg-yellow-400 text-black font-bold text-xs py-1 transform rotate-45 shadow-md z-10 pointer-events-none">
                      Previews
                    </div>
                  )}

                  <div className="h-72 w-full overflow-hidden sm:h-80 md:h-72">
                    <img
                      src={show.imgSrc || DEFAULT_IMG}
                      alt={`Poster for ${show.title}`}
                      className="w-full h-full object-cover transition-transform"
                      onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-1 bg-white/80 dark:bg-gray-800/90 h-40 justify-between">
                    <h2 className="text-center font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {show.title}
                    </h2>
                    {show.type && (
                      <p className="text-center text-sm italic text-gray-700 dark:text-gray-300">
                        {show.type}
                      </p>
                    )}
                    {show.venue && (
                      <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                        📍 {show.venue}
                      </p>
                    )}
                    <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                      Opening: {formatDate(show.openingdate)}
                    </p>
                    <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                      Closing: {formatDate(show.closingdate)}
                    </p>
                  </div>
                </a>
              </li>
            );
          })
        ) : (
          <li className="col-span-full text-center text-lg text-gray-700 dark:text-gray-300">
            No shows found
          </li>
        )}
      </ul>
    </div>
  );
}
