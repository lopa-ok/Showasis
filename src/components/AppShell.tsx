import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <p className="label">shower booking</p>
        <div className="flex justify-center items-center my-4">
          <img src="/logo.png" alt="Showasis Logo" className="h-16 w-auto object-contain" />
        </div>
        <p className="display-subtitle">{subtitle}</p>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}