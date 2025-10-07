"use client";

import { useState, useEffect, useMemo } from "react";

export default function ShowList({ shows }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("a-z");
  const [showPreviewsOnly, setShowPreviewsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [now, setNow] = useState(null);

  const DEFAULT_IMG =
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

  useEffect(() => setNow(new Date()), []);

  const toDate = (date) => {
    if (!date || date === "N/A" || date === "Open-ended") return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  };

  const isInPreviews = (date) => {
    if (!now) return false;
    const d = toDate(date);
    return d && d > now;
  };

  const formatDate = (date) => {
    if (!date || date === "N/A") return "N/A";
    if (date === "Open-ended") return "Open-ended";
    const d = toDate(date);
    if (!d) return "N/A";
    return now
      ? d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : d.toISOString().split("T")[0];
  };

  const filteredSortedShows = useMemo(() => {
    return shows
      .filter((show) => {
        // Filter by type
        if (filter !== "All") {
          const type = (show.type || "").toLowerCase();
          if (filter === "Musical" && !type.includes("musical")) return false;
          if (filter === "Play" && !type.includes("play")) return false;
          if (
            filter === "Other" &&
            ["musical", "play"].some((t) => type.includes(t))
          )
            return false;
        }

        // Filter previews only
        if (showPreviewsOnly && !isInPreviews(show.openingdate)) return false;

        // Filter search term
        if (
          searchTerm &&
          !show.title.toLowerCase().includes(searchTerm.toLowerCase())
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
          case "opening-latest":
            return (dateB || 0) - (dateA || 0);
          case "opening-earliest":
            return (dateA || 0) - (dateB || 0);
          default:
            return 0;
        }
      });
  }, [shows, filter, sort, showPreviewsOnly, searchTerm, now]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#FA8072",
          color: "white",
          textTransform: "uppercase",
          fontWeight: "bold",
          fontSize: "2rem",
          textAlign: "center",
          padding: "0.75rem 1rem",
          letterSpacing: "0.1em",
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          marginBottom: "1rem",
          border: "2px solid black",
        }}
      >
        Now Playing on West End
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          marginBottom: "2rem",
          padding: "0 1rem",
          width: "100%",
        }}
      >
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: "0 0 150px", // fixed base width
            minWidth: "200px",
          }}
        >
          <option>All</option>
          <option>Musical</option>
          <option>Play</option>
          <option>Other</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: "0 0 150px",
            minWidth: "200px",
          }}
        >
          <option value="a-z">Title A-Z</option>
          <option value="z-a">Title Z-A</option>
          <option value="opening-earliest">Opening Earliest</option>
          <option value="opening-latest">Opening Latest</option>
        </select>

        {/* Previews Only */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            flex: "0 0 180px",
            minWidth: "150px",
          }}
        >
          <input
            type="checkbox"
            checked={showPreviewsOnly}
            onChange={(e) => setShowPreviewsOnly(e.target.checked)}
          />
          In Previews
        </label>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flex: "1 1 auto", // take remaining space
            minWidth: "150px",
          }}
        />
      </div>

      {/* Show grid */}
      {filteredSortedShows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "white",
            fontSize: "1.5rem",
            marginTop: "4rem",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          }}
        >
          No shows found
        </div>
      ) : (
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
            padding: 0,
            listStyle: "none",
          }}
        >
          {filteredSortedShows.map(
            ({ title, imgSrc, type, openingdate, closingdate, link }, idx) => (
              <li key={`${title}-${type}-${idx}`}>
                <div
                  style={{
                    height: "600px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    border: "1px solid black",
                    borderRadius: 6,
                    overflow: "hidden",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease-in-out",
                    backgroundColor: "#FA8072",
                    fontFamily:
                      '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: "1rem",
                    color: "#000",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#FA8072";
                  }}
                >
                  {now && isInPreviews(openingdate) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "0.5rem",
                        left: "0.5rem",
                        backgroundColor: "#d9534f",
                        color: "white",
                        fontWeight: "bold",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        zIndex: 10,
                        textTransform: "uppercase",
                      }}
                    >
                      Currently in Previews
                    </div>
                  )}

                  <img
                    src={imgSrc || DEFAULT_IMG}
                    alt={title || "Show poster"}
                    style={{
                      width: "100%",
                      height: "400px",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                      transition: "transform 0.3s ease-in-out",
                    }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMG;
                    }}
                  />

                  <div
                    style={{
                      padding: "0.5rem 1rem",
                      fontWeight: "600",
                      fontSize: "1.1rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{
                      padding: "0 1rem",
                      fontSize: "0.95rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <em>{type}</em>
                  </div>

                  <div
                    style={{
                      padding: "0 1rem 1rem",
                      fontSize: "0.85rem",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <div>
                      <strong>Opening Date:</strong> {formatDate(openingdate)}
                    </div>
                    <div>
                      <strong>Closing:</strong> {formatDate(closingdate)}
                    </div>
                    {link && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            backgroundColor: "transparent",
                            color: "black",
                            borderRadius: "4px",
                            border: "1px solid black",
                            textDecoration: "none",
                            fontWeight: "bold",
                            transition: "background-color 0.2s ease-in-out",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#FA8072";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          More Info
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </main>
  );
}
