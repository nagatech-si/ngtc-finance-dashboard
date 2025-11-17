import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full bg-background">

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
