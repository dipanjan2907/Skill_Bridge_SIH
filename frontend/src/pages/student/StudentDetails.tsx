import MainLayout from "../../components/layout/MainLayout";
import Profile from "../Profile";

const StudentDetails = () => {
  return (
    <MainLayout showRightPanel={true}>
      <Profile />
    </MainLayout>
  );
};

export default StudentDetails;
