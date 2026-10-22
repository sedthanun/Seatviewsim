import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, FileImage } from "lucide-react";
import { Header, Footer } from "../components/Layout";
export default function Branch({ branch }) {
  return (
    <>
      <Header />
      <main className="branch-page section-shell">
        <Link className="text-link" to="/">
          <ArrowLeft size={16} /> All cinemas
        </Link>
        <div className="branch-layout">
          <img
            className="branch-art"
            src={branch.image.src}
            alt={branch.image.alt}
          />
          <div>
            <p className="eyebrow">{branch.location}</p>
            <h1>{branch.name}</h1>
            <span className="status pending">
              <i />
              {branch.status === "coming-soon"
                ? "Coming soon"
                : "Awaiting reference data"}
            </span>
            <h2>A view worth getting right.</h2>
            <p>
              Every seat tells a different story. This experience will open once
              the auditorium can be reconstructed from its actual seating plan
              and reference photographs.
            </p>
            <div className="reference-notice">
              <FileImage size={22} />
              <div>
                <strong>
                  {branch.id === "paragon"
                    ? "Paragon IMAX · References pending"
                    : "Auditorium details pending"}
                </strong>
                <p>
                  No verified seat map or auditorium model is available yet.
                </p>
              </div>
            </div>
            <a
              className="text-link"
              href={branch.source}
              target="_blank"
              rel="noreferrer"
            >
              Official cinema information <ArrowUpRight size={16} />
            </a>
            <p className="small-note">
              Artwork is representative, not a photograph of this cinema.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
