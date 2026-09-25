import React, { useEffect, useState } from "react";
import { I18nProvider } from "@/i18n";
import { Sidebar, PageKey } from "@/components/Sidebar";
import { ToastContainer } from "@/components/ToastContainer";
import { Splash } from "@/components/Splash";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";
import { useXpStore } from "@/store/xpStore";
import { useToastStore } from "@/store/toastStore";

import { Dashboard } from "@/pages/Dashboard";
import { Tasks } from "@/pages/Tasks";
import { Habits } from "@/pages/Habits";
import { Goals } from "@/pages/Goals";
import { StudyTimer } from "@/pages/StudyTimer";
import { Counselor } from "@/pages/Counselor";
import { ReportViewer } from "@/pages/ReportViewer";
import { Settings } from "@/pages/Settings";

const PAGES: Record<PageKey, React.FC> = {
  dashboard: Dashboard,
  tasks: Tasks,
  habits: Habits,
  goals: Goals,
  study: StudyTimer,
  counselor: Counselor,
  reports: ReportViewer,
  settings: Settings,
};

const App: React.FC = () => {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [booting, setBooting] = useState(true);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLang = useLangStore((s) => s.hydrate);
  const { hydrate: hydrateXp, listen, fetchBadges } = useXpStore();
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    (async () => {
      await Promise.all([hydrateTheme(), hydrateLang(), hydrateXp(), fetchBadges()]);
      listen();
      setTimeout(() => setBooting(false), 900);
    })();

    window.yaraav.xp.onBadgeUnlocked(({ title }) => push(`🏅 ${title}`, "success"));
  }, []);

  const ActivePage = PAGES[page];

  if (booting) return <Splash />;

  return (
    <I18nProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <Sidebar active={page} onNavigate={setPage} onExportReport={() => setPage("reports")} />
        <main className="flex-1 overflow-y-auto">
          <ActivePage />
        </main>
        <ToastContainer />
      </div>
    </I18nProvider>
  );
};

export default App;
