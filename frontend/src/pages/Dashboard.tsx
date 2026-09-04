import MainLayout from "../components/layout/MainLayout";
import Hero from "../components/dashboard/Hero";
import IndustryDemand from "../components/dashboard/IndustryDemand";
import SkillsToWatch from "../components/dashboard/SkillsToWatch";
import Collaboration from "../components/dashboard/Collaboration";

const Dashboard = () => {
  return (
    <MainLayout showRightPanel={true}>
      <Hero />
      <div className="lower-grid">
        <IndustryDemand />
        <SkillsToWatch />
      </div>

      <Collaboration />
    </MainLayout>
  );
};

export default Dashboard;
