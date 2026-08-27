import type { ReactNode } from "react";
import {
  Puzzle,
  Target,
  BookOpen,
  Briefcase,
  Rocket,
  ArrowRight,
} from "lucide-react";

interface JourneyItem {
  number: string;
  title: string;
  text: string;
  button: string;
  icon: ReactNode;
}

const journeyItems: JourneyItem[] = [

  {
    number: "01",
    icon: <Puzzle />,
    title: "Your Skills",
    text: "Understand your current strengths",
    button: "Skill DNA",
  },

  {
    number: "02",
    icon: <Target />,
    title: "Skill Gap",
    text: "Identify the skills you need to grow",
    button: "View Gap",
  },

  {
    number: "03",
    icon: <BookOpen />,
    title: "Learn",
    text: "Personalized learning to fill the gap",
    button: "Learning Path",
  },

  {
    number: "04",
    icon: <Briefcase />,
    title: "Get Experience",
    text: "Internships, projects & live experiences",
    button: "Explore",
  },

  {
    number: "05",
    icon: <Rocket />,
    title: "Get Hired",
    text: "Match with top companies",
    button: "Find Jobs",
  },

];

const CareerJourney = () => {
  return (
    <section className="journey-section">

      <div className="section-heading">

        <div>
          <h2>Your Career Journey</h2>

          <p>
            One platform. From skills to career.
          </p>
        </div>

      </div>


      <div className="journey">

        {journeyItems.map((item, index) => (

          <div
            className="journey-step"
            key={item.number}
          >

            <div className="step-number">
              {item.number}
            </div>

            <div
              className={`step-icon step-${index}`}
            >
              {item.icon}
            </div>

            <h3>{item.title}</h3>

            <p>{item.text}</p>

            <button>
              {item.button}
            </button>

            {index < journeyItems.length - 1 && (
              <ArrowRight
                className="journey-arrow"
                size={18}
              />
            )}

          </div>

        ))}

      </div>

    </section>
  );
};

export default CareerJourney;