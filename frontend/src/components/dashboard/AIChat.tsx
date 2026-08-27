import { useState } from "react";
import { Sparkles, Bot, Bell, CheckCircle2 } from "lucide-react";

const AIChatComingSoon = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 text-white shadow-2xl backdrop-blur-xl max-w-sm w-full">
      {/* Background Glows */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 tracking-tight leading-tight">
              AI Career Assistant
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400">
              <Sparkles size={11} /> Next-Gen AI
            </span>
          </div>
        </div>

        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
          Coming Soon
        </span>
      </div>

      {/* Main Pitch */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 mb-5 backdrop-blur-sm">
        <p className="text-xs font-semibold text-slate-300 mb-1">
          Tailored Career Intelligence 🚀
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          From personalized skill roadmaps to real-time resume refinement and
          internship matching.
        </p>
      </div>

      {/* Feature Teasers */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[
          "Skill Roadmaps",
          "Internship Radar",
          "Resume Review",
          "Role Matcher",
        ].map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2.5 py-2 text-[11px] text-slate-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {feature}
          </div>
        ))}
      </div>

      {/* Waitlist / Notify Box */}
      {subscribed ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-medium text-emerald-300">
          <CheckCircle2 size={15} /> You're on the early access list!
        </div>
      ) : (
        <form onSubmit={handleNotify} className="relative flex items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Get notified at launch..."
            required
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3.5 py-2.5 pr-24 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-500 active:scale-95"
          >
            <Bell size={12} />
            Notify
          </button>
        </form>
      )}
    </section>
  );
};

export default AIChatComingSoon;
