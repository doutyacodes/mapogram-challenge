"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { searchPlaces } from "@/utils/map/geocoding";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

/**
 * Search box with place suggestions (replaces Google Places <Autocomplete>).
 *
 * `onSelect(place)` receives { lat, lng, name, label }. Return `false` to reject
 * the place (e.g. outside an allowed area) — the input is then cleared.
 */
export default function PlaceSearchInput({
  onSelect,
  placeholder = "Search for a location...",
  near,
  disabled = false,
  inputClassName = "w-full px-4 py-2 pr-20 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500",
  showSearchButton = true,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  const listboxId = useId();
  const nearLat = near?.lat;
  const nearLng = near?.lng;

  // Debounced suggestions while typing.
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsOpen(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await searchPlaces(q, {
          near: nearLat != null ? { lat: nearLat, lng: nearLng } : undefined,
          signal: controller.signal,
        });
        setResults(places);
        setHighlighted(places.length ? 0 : -1);
        setError(places.length ? "" : "No places found");
        setIsOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Search is unavailable right now");
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, nearLat, nearLng]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const choose = (place) => {
    setIsOpen(false);
    setResults([]);
    const accepted = onSelect?.(place);
    const nextQuery = accepted === false ? "" : place.label || place.name;
    // Filling the box with the chosen label should not trigger a new search.
    if (nextQuery !== query) skipNextSearchRef.current = true;
    setQuery(nextQuery);
  };

  // Enter / search button: pick the highlighted suggestion, else search now.
  const searchNow = async () => {
    if (results[highlighted]) return choose(results[highlighted]);
    const q = query.trim();
    if (!q) return;
    setIsLoading(true);
    try {
      const [first] = await searchPlaces(q, {
        near: nearLat != null ? { lat: nearLat, lng: nearLng } : undefined,
        limit: 1,
      });
      if (first) choose(first);
      else {
        setError("Location not found. Try a different search term.");
        setIsOpen(true);
      }
    } catch {
      setError("Search is unavailable right now");
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setIsOpen(true);
      setHighlighted((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      searchNow();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length && setIsOpen(true)}
        placeholder={placeholder}
        className={inputClassName}
        disabled={disabled}
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-autocomplete="list"
        autoComplete="off"
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        {query && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {showSearchButton && (
          <button
            type="button"
            onClick={searchNow}
            disabled={disabled || isLoading}
            className="text-gray-400 hover:text-red-600 disabled:opacity-50 p-1"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || error) && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-[1100] mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm"
        >
          {results.map((place, index) => (
            <li key={`${place.lat},${place.lng},${index}`} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(place)}
                onMouseEnter={() => setHighlighted(index)}
                className={`w-full text-left px-3 py-2 flex items-start gap-2 ${index === highlighted ? "bg-gray-100" : "hover:bg-gray-50"}`}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
                <span className="text-gray-800">{place.label || place.name}</span>
              </button>
            </li>
          ))}
          {!results.length && error && <li className="px-3 py-2 text-gray-500">{error}</li>}
          <li className="px-3 py-1 text-[10px] text-gray-400 border-t border-gray-100">
            Search by Photon · © OpenStreetMap contributors
          </li>
        </ul>
      )}
    </div>
  );
}
