import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { X } from "lucide-react";
import CareerMatch from "../dashboard/CareerMatch";
import Opportunities from "../dashboard/Opportunities";
import AIChat from "../dashboard/AIChat";

interface MainLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

const MainLayout = ({ children, showRightPanel = true }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="main custom-scrollbar">
        <Topbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          isRightPanelOpen={isRightPanelOpen}
        />

        <div className="content">{children}</div>
      </main>

      {showRightPanel && (
        <>
          <div
            className={`right-panel-overlay ${isRightPanelOpen ? "open" : ""}`}
            onClick={() => setIsRightPanelOpen(false)}
          />

          <aside className={`right-panel ${isRightPanelOpen ? "open" : ""}`}>
            <div className="right-panel-header-mobile">
              <div className="mobile-title">
                <h3>Career Match & Assistant</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsRightPanelOpen(false)}
                aria-label="Close assistant panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="right-panel-content custom-scrollbar">
              <CareerMatch />
              <Opportunities />
              <AIChat />
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default MainLayout;
