import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-100 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="absolute top-0 right-0 -z-10">
          <div className="w-72 h-72 bg-gradient-to-bl from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 -z-10">
          <div className="w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl" />
        </div>

        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-40 w-72 hidden lg:block rounded-tr-3xl rounded-br-3xl overflow-hidden">
          <AppSidebar />
        </div>

        {/* CONTENT AREA */}
        <main
          className="flex-1 min-h-screen pl-0 lg:pl-[260px] lg:ml-4 p-4 lg:p-8 transition-all duration-300"
          style={{ maxWidth: '100vw' }}
        >
          {children}
        </main>

      </div>
    </SidebarProvider>
  );
}
