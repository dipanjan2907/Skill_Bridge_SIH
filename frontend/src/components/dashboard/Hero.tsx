import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-text">
        <span className="eyebrow">YOUR CAREER JOURNEY</span>

        <h1>
          Where are you now,
          <br />
          and where do you want to go?
        </h1>

        <p>
          We'll help you bridge the gap between your skills and your dream
          career.
        </p>

        <button className="primary-btn">
          Start My Journey
          <ArrowRight size={17} />
        </button>
      </div>

      <div className="hero-illustration absolute">
        <div className="mountain mountain-one" />

        <div className="mountain mountain-two" />

        <div className="road">
          <div className="road-point point1">
            <span>01</span>
            <b>Your Skills</b>
          </div>

          <div className="road-point point2">
            <span>02</span>
            <b>Learn</b>
          </div>

          <div className="road-point point3">
            <span>03</span>
            <b>Get Hired</b>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
