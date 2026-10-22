import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { canSimulate } from "../data/branches";
export default function CinemaCard({ branch, index }) {
  const ready = branch.auditoriums.some((a) => canSimulate(branch, a));
  const pending = branch.status === "awaiting-references";
  const label = ready
    ? "Available for demo"
    : pending
      ? "Awaiting reference data"
      : "Coming soon";
  return (
    <article className={`cinema-card ${pending || ready ? "featured" : ""}`}>
      <div className="card-image">
        <img src={branch.image.src} alt={branch.image.alt} loading="lazy" />
        <span className={`status ${pending || ready ? "pending" : ""}`}>
          <i />
          {label}
        </span>
        {branch.image.representative && (
          <span className="image-label">REPRESENTATIVE ILLUSTRATION</span>
        )}
      </div>
      <div className="card-copy">
        <p className="card-brand">
          {branch.brand}
          <span>{String(index + 1).padStart(2, "0")}</span>
        </p>
        <h3>{branch.name}</h3>
        <p className="location">
          <MapPin size={13} />
          {branch.location}
        </p>
        <div className="card-bottom">
          <span>
            {ready
              ? "Explore your perspective"
              : pending
                ? `${branch.features.join(" · ")} · First destination`
                : "A new view is on its way"}
          </span>
          {pending || ready ? (
            <Link
              aria-label={`View ${branch.name} details`}
              to={`/cinemas/${branch.id}`}
            >
              <ArrowUpRight size={21} />
            </Link>
          ) : (
            <span className="locked-arrow" aria-label="Not yet available">
              <ArrowUpRight size={21} />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
