"use client";

import { useState, useEffect, useMemo } from "react";

export default function ShowList({ shows }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("a-z");
  const [showPreviewsOnly, setShowPreviewsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [now, setNow] = useState(null); // Hydration-safe current time

  const DEFAULT_IMG =
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/London_%2844761485915%29.jpg";

  // Inject responsive styles once
  useEffect(() => {
    setNow(new Date()); // Set current time after client hydration

    const style = document.createElement("style");
    style.innerHTML = `
      @media (max-width: 600px) {
        .search-controls { flex-direction: column !important; gap: 0.75rem !important; }
        .search-controls input { width: 100% !important; max-width: 300px; }
        .top-controls { flex-direction: column !important; align-items: center !important; gap: 0.5rem !important; }
        .filter-buttons { justify-content: center !important; flex-wrap: wrap !important; gap: 0.5rem !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function toDate(date) {
    if (!date || date === "N/A" || date === "Open-ended") return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }

  function isInPreviews(date) {
    if (!now) return false; // Avoid mismatch on SSR
    const d = toDate(date);
    return d && d > now;
  }

  function formatDate(date) {
    if (!date || date === "N/A") return "N/A";
    if (date === "Open-ended") return "Open-ended";

    const d = toDate(date);
    if (!d) return "N/A";

    // Format only on client after hydration
    return now ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : d.toISOString().split("T")[0];
  }

  const filteredSortedShows = useMemo(() => {
    return shows
      .filter((show) => {
        if (filter !== "All") {
          const type = (show.type || "").toLowerCase();
          if (filter === "Musical" && !type.includes("musical")) return false;
          if (filter === "Play" && !type.includes("play")) return false;
          if (filter === "Other" && ["musical", "play"].some((t) => type.includes(t))) return false;
        }

        if (showPreviewsOnly && !isInPreviews(show.openingdate)) return false;

        if (searchTerm && !show.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = toDate(a.openingdate);
        const dateB = toDate(b.openingdate);
        switch (sort) {
          case "a-z": return a.title.localeCompare(b.title);
          case "z-a": return b.title.localeCompare(a.title);
          case "opening-latest": return (dateB || 0) - (dateA || 0);
          case "opening-earliest": return (dateA || 0) - (dateB || 0);
          default: return 0;
        }
      });
  }, [shows, filter, sort, showPreviewsOnly, searchTerm, now]);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "black", color: "white", boxSizing: "border-box" }}>
      <div style={{
        backgroundColor: "#FA8072", color: "white", textTransform: "uppercase",
        fontWeight: "bold", fontSize: "2rem", textAlign: "center", padding: "0.75rem 1rem",
        letterSpacing: "0.1em", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        marginBottom: "1rem", border: "2px solid black"
      }}>
        Now Playing on West End
      </div>

      <div style={{ padding: "4rem" }}>
        {/* Controls */}
        <div className="search-controls" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: "0 0 auto" }}>
            <label htmlFor="sort" style={{ marginRight: 8 }}>Sort by:</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}
              style={{ padding: "0.4rem 0.6rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "1rem", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              <option value="a-z">Title A-Z</option>
              <option value="z-a">Title Z-A</option>
              <option value="opening-latest">Newest To Oldest</option>
              <option value="opening-earliest">Oldest To Newest</option>
            </select>
          </div>

          <div style={{ flex: "1 1 auto", minWidth: "200px", textAlign: "center" }}>
            <input type="text" placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #ccc", fontSize: "1rem", width: "100%", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }} />
          </div>

          <div className="top-controls" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", flex: "0 0 auto", justifyContent: "flex-end" }}>
            <div className="filter-buttons" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["All", "Musical", "Play", "Other"].map((type) => (
                <button key={type} onClick={() => setFilter(type)}
                  style={{
                    padding: "0.5rem 1rem", border: "none", borderRadius: "4px",
                    backgroundColor: filter === type ? "#FA8072" : "#444",
                    color: filter === type ? "#000" : "#fff", fontWeight: "bold", cursor: "pointer",
                    transition: "all 0.2s ease-in-out", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                  }}>
                  {type}
                </button>
              ))}
              <button onClick={() => setShowPreviewsOnly((prev) => !prev)}
                style={{
                  padding: "0.5rem 1rem", border: "none", borderRadius: "4px",
                  backgroundColor: showPreviewsOnly ? "#d9534f" : "#444",
                  color: "#fff", fontWeight: "bold", cursor: "pointer",
                  transition: "all 0.2s ease-in-out", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  marginLeft: "0.5rem"
                }}>
                Currently in Previews
              </button>
            </div>
          </div>
        </div>

        {/* Show grid */}
        {filteredSortedShows.length === 0 ? (
          <div style={{ textAlign: "center", color: "white", fontSize: "1.5rem", marginTop: "4rem", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            No shows found
          </div>
        ) : (
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem", padding: 0, listStyle: "none" }}>
            {filteredSortedShows.map(({ title, imgSrc, type, openingdate, closingdate, link }, idx) => (
              <li key={`${title}-${type}-${idx}`}>
                <div style={{
                  position: "relative", height: "100%", minHeight: "400px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  cursor: "pointer", border: "1px solid black", borderRadius: 6,
                  overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease-in-out", backgroundColor: "#FA8072",
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontSize: "1rem", color: "#000"
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,112,243,0.3)";
                    e.currentTarget.style.border = "2px solid white";
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.color = "#000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                    e.currentTarget.style.border = "1px solid black";
                    e.currentTarget.style.backgroundColor = "#FA8072";
                    e.currentTarget.style.color = "#000";
                  }}>
                  {now && isInPreviews(openingdate) && (
                    <div style={{
                      position: "absolute", top: "0.5rem", left: "0.5rem",
                      backgroundColor: "#d9534f", color: "white", fontWeight: "bold",
                      padding: "0.25rem 0.5rem", borderRadius: "4px",
                      fontSize: "0.75rem", zIndex: 10, textTransform: "uppercase"
                    }}>
                      Currently in Previews
                    </div>
                  )}

                  <img src={imgSrc || DEFAULT_IMG} alt={title || "Show poster"}
                    style={{ width: "100%", height: "400px", objectFit: "cover", objectPosition: "center", display: "block", transition: "transform 0.3s ease-in-out" }}
                    loading="lazy"
                  />

                  <div style={{ padding: "0.5rem 1rem", fontWeight: "600", fontSize: "1.1rem" }}>{title}</div>
                  <div style={{ padding: "0 1rem 0.5rem", fontSize: "0.95rem" }}><em>{type}</em></div>

                  <div style={{ padding: "0 1rem 1rem", fontSize: "0.85rem" }}>
                    <div><strong>Opening Date:</strong> {formatDate(openingdate)}</div>
                    <div><strong>Closing:</strong> {formatDate(closingdate)}</div>
                    <div style={{ marginTop: "1rem" }}>
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: "inline-block", padding: "0.5rem 1rem", backgroundColor: "transparent",
                            color: "black", borderRadius: "4px", border: "1px solid black", textDecoration: "none",
                            fontWeight: "bold", transition: "background-color 0.2s ease-in-out"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FA8072"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          More Info
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
