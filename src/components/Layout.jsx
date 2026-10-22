import { Link } from "react-router-dom";
import { Aperture, ArrowUpRight } from "lucide-react";
export function Header() {
  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Vantage home">
        <Aperture size={25} strokeWidth={1.5} /> VANTAGE
        <span className="wordmark-dot">®</span>
      </Link>
      <nav aria-label="Main navigation">
        <a href="/#cinemas">The cinemas</a>
        <a href="/#how-it-works">The experience</a>
      </nav>
      <span className="edition">
        <span /> A NEW POINT OF VIEW
      </span>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <Link className="wordmark" to="/">
        <Aperture size={20} /> VANTAGE
      </Link>
      <p>An independent exploration of the cinema experience.</p>
      <a href="/#cinemas">
        Find your perspective <ArrowUpRight size={14} />
      </a>
      <small>
        Concept preview · Not affiliated with IMAX or the featured cinemas.
      </small>
    </footer>
  );
}
