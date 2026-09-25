import React, { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n";
import { Button } from "./Button";

const WORK_SECONDS = 25 * 60;

export const Pomodoro: React.FC = () => {
  const { t } = useT();
  const [seconds, setSeconds] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setRunning(false);
            window.yaraav.notify.show("Pomodoro", "زمان تمام شد! کمی استراحت کن ☕");
            return WORK_SECONDS;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-mono font-bold text-light-text dark:text-dark-text tabular-nums">
        {mm}:{ss}
      </span>
      <Button variant="ghost" onClick={() => setRunning((r) => !r)}>
        {running ? t("tasks.pause") : t("tasks.start")}
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          setRunning(false);
          setSeconds(WORK_SECONDS);
        }}
      >
        {t("tasks.reset")}
      </Button>
    </div>
  );
};
