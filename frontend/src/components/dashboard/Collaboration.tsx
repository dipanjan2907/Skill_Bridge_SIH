import type { ReactNode } from "react";
import {
  Users,
  GraduationCap,
  Brain,
} from "lucide-react";

interface CollaborationItem {
  title: string;
  text: string;
  icon: ReactNode;
}

const items: CollaborationItem[] = [

  {
    title: "Live Projects",
    text: "Work on real industry problems",
    icon: <Users />,
  },

  {
    title: "Industry Mentors",
    text: "Learn from experts in your field",
    icon: <Users />,
  },

  {
    title: "Guest Lectures",
    text: "Insights from industry leaders",
    icon: <GraduationCap />,
  },

  {
    title: "Research Collaboration",
    text: "Build innovative solutions together",
    icon: <Brain />,
  },

];

const Collaboration = () => {
  return (
    <section className="collaboration">

      <div className="section-heading">

        <div>
          <h2>
            Industry–Academia Collaboration
          </h2>

          <p>
            Real connections. Real impact.
          </p>
        </div>

      </div>


      <div className="collab-grid">

        {items.map((item) => (

          <div
            className="collab-card"
            key={item.title}
          >

            <div className="collab-icon">
              {item.icon}
            </div>

            <div>

              <h3>
                {item.title}
              </h3>

              <p>
                {item.text}
              </p>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
};

export default Collaboration;