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
        <h1 className="display-title">{title}</h1>
        <p className="display-subtitle">{subtitle}</p>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}