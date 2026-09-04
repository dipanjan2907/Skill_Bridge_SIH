import React from "react";
import MainLayout from "../../components/layout/MainLayout";
import IndustryQuestionManagement from "../../components/industry/IndustryQuestionManagement";

const IndustryQuestionPage: React.FC = () => {
  return (
    <MainLayout showRightPanel={false}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <IndustryQuestionManagement />
      </div>
    </MainLayout>
  );
};

export default IndustryQuestionPage;
