import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Experience from "../simulator/Experience";
import { fixture } from "./fixture";
import VideoModeSelector from "../components/VideoModeSelector";

const previewSeats = fixture.seats.slice(0, 3);

export default function SimulationUIPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoMode, setVideoMode] = useState("pre-show");
  const navigate = useNavigate();
  const leave = useCallback(() => navigate("/"), [navigate]);

  return <Experience
    config={fixture}
    seat={previewSeats[activeIndex]}
    selectedSeats={previewSeats}
    onSeatChange={(id) => setActiveIndex(previewSeats.findIndex((seat) => seat.id === id))}
    onExit={leave}
    controlsAction={<VideoModeSelector value={videoMode} onChange={setVideoMode} />}
  />;
}
