import type { ReactNode } from "react";
import Image from "next/image";

type AppShellProps = {
  subtitle: string;
  children: ReactNode;
};

export default function AppShell({ subtitle, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <p className="label">shower booking</p>
        <div className="flex justify-center items-center my-4">
          <Image src="/logo.png" alt="Showasis Logo" width={200} height={64} className="h-16 w-auto object-contain" priority />
        </div>
        <p className="display-subtitle">{subtitle}</p>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}