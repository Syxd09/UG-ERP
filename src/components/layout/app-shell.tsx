import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-row print:bg-white print:block">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 print:block">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:block">{children}</main>
      </div>
    </div>
  );
}

