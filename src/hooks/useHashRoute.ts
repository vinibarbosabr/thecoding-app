import { useEffect, useState } from "react";

/**
 * Hash routing for the #/data view (ADR-04 §1): zero server config,
 * no router dependency, shareable urls. Everything not recognized
 * falls back to the hub.
 */

export function parseRoute(hash: string): string {
  return hash.replace(/^#\/?/, "").split(/[/?]/)[0];
}

export function useHashRoute(): string {
  const [route, setRoute] = useState<string>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
