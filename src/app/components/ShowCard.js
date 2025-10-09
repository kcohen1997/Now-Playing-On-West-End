export default function ShowCard({
  show,
  formatDate,
  isInPreviews,
  defaultImg,
}) {
  const inPreviews = isInPreviews(show.openingdate);

  return (
    <li className="w-full max-w-[280px] flex flex-col relative">
      <a
        href={show.link || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col h-full rounded-lg overflow-hidden shadow-lg transform transition hover:scale-105 relative"
      >
        {/* Previews Ribbon */}
        {inPreviews && (
          <div className="absolute top-3 right-[-35px] w-28 text-center bg-yellow-400 text-black font-bold text-xs py-1 transform rotate-45 shadow-md z-10 pointer-events-none">
            Previews
          </div>
        )}

        {/* Image */}
        <div className="h-110 w-full overflow-hidden">
          <img
            src={show.imgSrc || defaultImg}
            alt={`Poster for ${show.title}`}
            className="w-full h-full object-cover transition-transform"
            onError={(e) => (e.currentTarget.src = defaultImg)}
            loading="lazy"
          />
        </div>

        {/* Show Info */}
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
}
