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

  // Detect system theme + screen size
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(media.matches ? "dark" : "light");

    const handleResize = () => setIsMobile(window.innerWidth < 600);
    handleResize();

    media.addEventListener("change", (e) =>
      setTheme(e.matches ? "dark" : "light")
    );
    window.addEventListener("resize", handleResize);

    return () => {
      media.removeEventListener("change", () => {});
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // --- Date helpers ---
  const toDate = (date) => {
    if (!date || date === "N/A" || date === "Open-ended") return null;
    const cleanDate = date.trim().slice(0, 10);
    const d = new Date(cleanDate);
    return isNaN(d.getTime()) ? null : d;
  };

  const isInPreviews = (date) => {
    const d = toDate(date);
    return d && d > now;
  };

  const formatDate = (date) => {
    if (!date || date === "N/A") return "N/A";
    if (date === "Open-ended") return "Open-ended";
    const d = toDate(date);
    if (!d) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // --- Filter + sort + search ---
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
          !show.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = toDate(a.openingdate);
        const dateB = toDate(b.openingdate);
        switch (sort) {
          case "a-z":
            return a.title.localeCompare(b.title);
          case "z-a":
            return b.title.localeCompare(a.title);
          case "opening-earliest":
            return (dateA || 0) - (dateB || 0);
          case "opening-latest":
            return (dateB || 0) - (dateA || 0);
          default:
            return 0;
        }
      });
  }, [shows, filter, sort, showPreviewsOnly, searchTerm, now]);

  // --- Theme palette ---
  const colors =
    theme === "dark"
      ? {
          background: "linear-gradient(to bottom, #0f0f0f, #1e1e1e)",
          text: "#f0f0f0",
          card: "rgba(255,255,255,0.08)",
          accent: "#FA8072",
          subtext: "#ccc",
        }
      : {
          background: "linear-gradient(to bottom, #fffaf0, #ffe4e1)",
          text: "#222",
          card: "rgba(255,255,255,0.85)",
          accent: "#e74c3c",
          subtext: "#555",
        };

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: colors.background,
        color: colors.text,
        minHeight: "100vh",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "1rem" : "1.5rem 3rem",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? "1.75rem" : "2.25rem",
            margin: 0,
          }}
        >
          Now Playing in London’s West End
        </h1>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            marginTop: isMobile ? "1rem" : 0,
            background: colors.accent,
            border: "none",
            borderRadius: "8px",
            color: theme === "dark" ? "#000" : "#fff",
            padding: "0.6rem 1rem",
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.2s ease",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "center",
          gap: isMobile ? "0.75rem" : "1rem",
          flexWrap: "wrap",
          margin: "0 auto",
          maxWidth: "800px",
          padding: isMobile ? "0 1rem" : "0 2rem",
        }}
      >
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #aaa",
            width: isMobile ? "100%" : "200px",
            background: colors.card,
            color: colors.text,
          }}
        >
          <option value="All">All Shows</option>
          <option value="Musical">Musicals</option>
          <option value="Play">Plays</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #aaa",
            width: isMobile ? "100%" : "200px",
            background: colors.card,
            color: colors.text,
          }}
        >
          <option value="a-z">Sort A–Z</option>
          <option value="z-a">Sort Z–A</option>
          <option value="opening-earliest">Opening Earliest</option>
          <option value="opening-latest">Opening Latest</option>
        </select>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: colors.text,
            fontSize: "1rem",
          }}
        >
          <input
            type="checkbox"
            checked={showPreviewsOnly}
            onChange={(e) => setShowPreviewsOnly(e.target.checked)}
          />
          Previews only
        </label>

        {/* Search */}
        <div
          style={{
            position: "relative",
            width: isMobile ? "100%" : "450px",
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 2.5rem 0.75rem 1rem",
              fontSize: "1rem",
              borderRadius: "999px",
              border: "1px solid #aaa",
              background: colors.card,
              color: colors.text,
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = colors.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#aaa")}
          />
          <span
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.subtext,
              fontSize: "1.1rem",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* Show Grid */}
      <ul
        style={{
          listStyle: "none",
          padding: isMobile ? "1rem 0.5rem" : "2rem",
          margin: 0,
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fill, minmax(220px, 1fr))",
          gap: isMobile ? "1.25rem" : "2rem",
          justifyItems: "center",
        }}
      >
        {filteredShows.length > 0 ? (
          filteredShows.map((show, index) => (
            <li
              key={index}
              style={{
                background: colors.card,
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow:
                  theme === "dark"
                    ? "0 4px 12px rgba(255,255,255,0.1)"
                    : "0 4px 12px rgba(0,0,0,0.2)",
                width: "100%",
                maxWidth: "360px",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {/* Image container for fixed aspect ratio */}
              <div
                style={{
                  width: "100%",
                  height: isMobile ? "280px" : "220px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={show.imgSrc || DEFAULT_IMG}
                  alt={show.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                  onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
                />
              </div>

              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flexGrow: 1,
                }}
              >
                <h2
                  style={{
                    fontSize: isMobile ? "1.1rem" : "1.3rem",
                    margin: 0,
                    lineHeight: 1.3,
                    textAlign: "center",
                  }}
                >
                  {show.title}
                </h2>

                {show.type && (
                  <p
                    style={{
                      fontSize: "0.9rem",
                      textAlign: "center",
                      color: colors.subtext,
                      margin: 0,
                    }}
                  >
                    <em>{show.type}</em>
                  </p>
                )}

                {show.venue && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      textAlign: "center",
                      color: colors.subtext,
                      margin: 0,
                    }}
                  >
                    📍 {show.venue}
                  </p>
                )}

                <p
                  style={{
                    fontSize: "0.85rem",
                    textAlign: "center",
                    color: colors.subtext,
                    margin: 0,
                  }}
                >
                  Opening: {formatDate(show.openingdate)}
                </p>
                <p
                  style={{
                    fontSize: "0.85rem",
                    textAlign: "center",
                    color: colors.subtext,
                    margin: 0,
                  }}
                >
                  Closing: {formatDate(show.closingdate)}
                </p>
              </div>
            </li>
          ))
        ) : (
          <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
            No shows found
          </p>
        )}
      </ul>
    </div>
  );
}
