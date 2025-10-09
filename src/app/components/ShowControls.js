export default function ShowControls({
  filter,
  setFilter,
  sort,
  setSort,
  showPreviewsOnly,
  setShowPreviewsOnly,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <div className="sticky top-0 z-20 bg-white px-4 md:px-8 py-3 md:py-4 border-b border-gray-300 flex flex-col sm:flex-col md:flex-row flex-wrap gap-2 md:gap-3 items-center">
      {/* Filter */}
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

      {/* Sort */}
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

      {/* Only Show Previews? */}
      <label className="flex items-center gap-2 text-gray-900">
        <input
          type="checkbox"
          checked={showPreviewsOnly}
          onChange={(e) => setShowPreviewsOnly(e.target.checked)}
          className="w-4 h-4"
        />
        Previews Only
      </label>

      {/* Search By Title */}
      <input
        type="text"
        placeholder="Search by title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-96 px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-900"
      />
    </div>
  );
}
