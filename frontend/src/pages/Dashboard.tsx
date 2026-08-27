import MainLayout from "../components/layout/MainLayout";
import Hero from "../components/dashboard/Hero";
import CareerJourney from "../components/dashboard/CareerJourney";
import IndustryDemand from "../components/dashboard/IndustryDemand";
import SkillsToWatch from "../components/dashboard/SkillsToWatch";
import Collaboration from "../components/dashboard/Collaboration";

const Dashboard = () => {
  return (
    <MainLayout showRightPanel={true}>
      <Hero />

      <CareerJourney />

      <div className="lower-grid">
        <IndustryDemand />
        <SkillsToWatch />
      </div>

      <Collaboration />
    </MainLayout>
  );
};

export default Dashboard;