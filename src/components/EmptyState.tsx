import React from "react";

export const EmptyState: React.FC<{ message: string; icon?: string }> = ({ message, icon = "✨" }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
    <div className="text-5xl mb-3">{icon}</div>
    <p className="text-light-subtext dark:text-dark-subtext text-sm max-w-xs">{message}</p>
  </div>
);
