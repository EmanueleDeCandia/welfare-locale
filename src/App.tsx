import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Ecosystem from "./components/Ecosystem";
import Simulator from "./components/Simulator";
import Orbital3D from "./components/Orbital3D";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen bg-ink font-sans text-bone">
      <div className="noise" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Ecosystem />
        <Simulator />
        <Orbital3D />
      </main>
      <Footer />
    </div>
  );
}
