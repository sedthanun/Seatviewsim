import Simulator from "../pages/Simulator";
import { fixture } from "./fixture";
export default function Preview() {
  return <Simulator config={fixture} basePath="/__dev/simulator" synthetic />;
}
