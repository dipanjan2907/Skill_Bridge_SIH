import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { ArrowLeft, Clock, Rocket, ShieldCheck, Cpu } from "lucide-react";

const ComingSoonPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const featureName = searchParams.get("feature") || "Feature";

  return (
    <MainLayout>
      <div className="coming-soon-wrapper" style={{ padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
            background: "var(--card-bg, rgba(255, 255, 255, 0.05))",
            color: "var(--text-color, #f1f5f9)",
            cursor: "pointer",
            marginBottom: "2rem",
            fontSize: "0.9rem",
            transition: "all 0.2s ease",
          }}
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        <div
          className="coming-soon-card"
          style={{
            background: "var(--card-bg, #1e293b)",
            border: "1px solid var(--border-color, #334155)",
            borderRadius: "1rem",
            padding: "3rem 2rem",
            textAlign: "center",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "250px",
              height: "250px",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            <Clock size={14} />
            <span>IN ACTIVE DEVELOPMENT</span>
          </div>

          {/* Icon */}
          <div
            style={{
              width: "4rem",
              height: "4rem",
              margin: "0 auto 1.5rem",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Rocket size={32} />
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--text-color, #f8fafc)",
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            {featureName} is Coming Soon
          </h1>

          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary, #94a3b8)",
              maxWidth: "500px",
              margin: "0 auto 2rem",
              lineHeight: 1.6,
            }}
          >
            We are engineering this feature with real-time industry analytics and high-performance algorithms for the SkillBridge platform.
          </p>

          {/* Highlights */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              textAlign: "left",
              marginBottom: "2.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#818cf8", marginBottom: "0.3rem", fontWeight: 600 }}>
                <Cpu size={16} />
                Real-Time Data Integration
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)", margin: 0 }}>
                Powered by our active MySQL opportunity aggregation engine.
              </p>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#34d399", marginBottom: "0.3rem", fontWeight: 600 }}>
                <ShieldCheck size={16} />
                Verified Industry Quality
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94a3b8)", margin: 0 }}>
                Ensuring smooth collaboration between students and academia.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              Back to Dashboard
            </button>

            <button
              onClick={() => navigate("/opportunities")}
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "0.5rem",
                background: "transparent",
                color: "var(--text-color, #f8fafc)",
                border: "1px solid var(--border-color, #475569)",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Explore Opportunities
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ComingSoonPage;
