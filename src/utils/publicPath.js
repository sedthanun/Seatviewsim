export function publicPath(path, base = import.meta.env.BASE_URL) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path.slice(1)}`;
}
