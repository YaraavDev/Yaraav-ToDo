import React from "react";
import logoDark from "@/assets/logo-dark.png";

export const Splash: React.FC = () => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
    <img src={logoDark} alt="Yaraav" className="w-32 h-32 animate-pulse" />
  </div>
);
