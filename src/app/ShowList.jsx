"use client";

import { useState, useEffect, useMemo } from "react";

export default function ShowList({ shows }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("a-z");

  // Inject responsive styles only once
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media (max-width: 600px) {
        .top-controls {
          flex-direction: column !important;
          align-items: center !important;
          gap: 0.75rem !important;
        }
        .top-controls > div {
          width: 100% !important;
          max-width: 300px;
          text-align: center;
        }
        .top-controls select {
          width: 100% !important;
        }
        .filter-buttons {
          justify-content: center !important;
          flex-wrap: wrap;
          gap: 0.5rem !important;
        }
        .filter-buttons button {
          margin-right: 0 !important;
          flex: 1 1 auto;
          max-width: 120px;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Convert date strings to Date objects safely, or null if invalid
  function toDate(date) {
    if (!date || date === "N/A" || date === "Open-ended") return null;
    const d = new Date(date);
    return isNaN(d) ? null : d;
  }

  // useMemo to avoid recalculating on every render unless dependencies change
  const filteredSortedShows = useMemo(() => {
    const filtered = shows.filter((show) => {
      if (filter === "All") return true;
      const lowerType = (show.type || "").toLowerCase();
      if (filter === "Musical") return lowerType.includes("musical");
      if (filter === "Play") return lowerType.includes("play");
      if (filter === "Other")
        return !["musical", "play"].some((t) => lowerType.includes(t));
      return true;
    });

    return filtered.slice().sort((a, b) => {
      switch (sort) {
        case "a-z":
          return a.title.localeCompare(b.title);
        case "z-a":
          return b.title.localeCompare(a.title);
        case "opening-latest": {
          const aDate = toDate(a.openingdate);
          const bDate = toDate(b.openingdate);
          if (!aDate) return 1;
          if (!bDate) return -1;
          return bDate - aDate;
        }
        case "opening-earliest": {
          const aDate = toDate(a.openingdate);
          const bDate = toDate(b.openingdate);
          if (!aDate) return 1;
          if (!bDate) return -1;
          return aDate - bDate;
        }
        default:
          return 0;
      }
    });
  }, [shows, filter, sort]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFD700",
          color: "black",
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
        Now Playing on Broadway
      </div>

      <div style={{ padding: "2rem" }}>
        <div
          className="top-controls"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <label htmlFor="sort" style={{ marginRight: 8 }}>
              Sort by:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: "0.4rem 0.6rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              <option value="a-z">Title A-Z</option>
              <option value="z-a">Title Z-A</option>
              <option value="opening-latest">Newest To Oldest</option>
              <option value="opening-earliest">Oldest To Newest</option>
            </select>
          </div>

          <div className="filter-buttons" style={{ display: "flex" }}>
            {["All", "Musical", "Play", "Other"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                style={{
                  marginRight: "1rem",
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: filter === type ? "#EADB5A" : "#444",
                  color: filter === type ? "#000" : "#fff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

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
            (
              { title, imgSrc, type, openingdate, closingdate, link },
              idx
            ) => (
              <li key={`${title}-${type}-${idx}`} style={{ listStyle: "none" }}>
                <div
                  style={{
                    height: "100%",
                    minHeight: "400px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    border: "1px solid black",
                    borderRadius: 6,
                    overflow: "hidden",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease-in-out",
                    backgroundColor: "#EADB5A",
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: "1rem",
                    color: "#000",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 112, 243, 0.3)";
                    e.currentTarget.style.border = "2px solid white";
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.color = "#000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 6px rgba(0,0,0,0.1)";
                    e.currentTarget.style.border = "1px solid black";
                    e.currentTarget.style.backgroundColor = "#EADB5A";
                    e.currentTarget.style.color = "#000";
                  }}
                >
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={title || "Broadway show poster"}
                      style={{
                        width: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                        transition: "transform 0.3s ease-in-out",
                      }}
                      loading="lazy"
                    />
                  )}
                  <div
                    style={{
                      padding: "0.5rem 1rem",
                      fontWeight: "600",
                      fontSize: "1.1rem",
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      padding: "0 1rem 0.5rem",
                      fontSize: "0.95rem",
                      color: "#555",
                    }}
                  >
                    <em>{type}</em>
                  </div>
                  <div
                    style={{
                      padding: "0 1rem 1rem",
                      fontSize: "0.85rem",
                      color: "#444",
                    }}
                  >
                    <div>
                      <strong>Opening Date:</strong> {formatDate(openingdate)}
                    </div>
                    <div>
                      <strong>Closing:</strong> {formatDate(closingdate)}
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "0.5rem 1rem",
                          backgroundColor: "transparent",
                          color: "black",
                          borderRadius: "4px",
                          border: "1px solid black",
                          textDecoration: "none",
                          fontWeight: "bold",
                          transition: "background-color 0.2s ease-in-out",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#EADB5A";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        More Info
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      </div>
    </main>
  );
}

// Helper to format date strings or special cases
function formatDate(date) {
  if (!date || date === "N/A") return "N/A";
  if (date === "Open-ended") return "Open-ended";

  // Convert string to Date if needed
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return "N/A";

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
