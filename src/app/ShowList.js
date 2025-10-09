"use client";

import { useState, useEffect, useMemo } from "react";
import ShowControls from "./components/ShowControls";
import ShowCard from "./components/ShowCard";

const DEFAULT_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

export default function ShowList({ shows }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("a-z");
  const [showPreviewsOnly, setShowPreviewsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState("light");
  const now = new Date();

  // Theme and Responsiveness to Theme Change
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => setTheme(e.matches ? "dark" : "light");
    setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handleThemeChange);
    return () => media.removeEventListener("change", handleThemeChange);
  }, []);

  const darkMode = theme === "dark";

  // ----------------- Date Helpers -----------------

  // Convert into Date object
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

  // Format how date will look
  const formatDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return dateStr || "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check is Date is In Previews
  const isInPreviews = (dateStr) => {
    const d = parseDate(dateStr);
    return d && d > now;
  };

  //  Filtered and Sorted Shows
  const filteredShows = useMemo(() => {
    return shows
      .filter((show) => {
        const type = (show.type || show.category || "").toLowerCase();

        // Filter by category
        if (filter !== "All") {
          if (filter === "Musical" && !type.includes("musical")) return false;
          if (filter === "Play" && !type.includes("play")) return false;
          if (
            filter === "Other" &&
            ["musical", "play"].some((t) => type.includes(t))
          )
            return false;
        }

        // Filter previews
        if (showPreviewsOnly && !isInPreviews(show.openingdate)) return false;

        // Search filter
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
          className={`mt-4 md:mt-0 px-4 py-2 rounded-lg font-semibold transition-transform duration-200 ${
            darkMode
              ? "bg-pink-300 text-black hover:scale-105"
              : "bg-red-600 text-white hover:scale-105"
          }`}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      {/* Controls (Filter, Sort, Search) */}
      <ShowControls
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        showPreviewsOnly={showPreviewsOnly}
        setShowPreviewsOnly={setShowPreviewsOnly}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Show Grid */}
      <ul className="grid gap-4 px-4 md:px-12 mb-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center mt-6">
        {filteredShows.length > 0 ? (
          filteredShows.map((show, index) => (
            <ShowCard
              key={index}
              show={show}
              formatDate={formatDate}
              isInPreviews={isInPreviews}
              darkMode={darkMode}
              defaultImg={DEFAULT_IMG}
            />
          ))
        ) : (
          <li className="col-span-full text-center text-lg text-gray-700 dark:text-gray-300">
            No shows found
          </li>
        )}
      </ul>
    </div>
  );
}
