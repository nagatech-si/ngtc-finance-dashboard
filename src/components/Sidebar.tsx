import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Receipt,
  ChevronDown,
  LogOut,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export default function AppSidebar() {
  const location = useLocation();
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.startsWith("/master")) {
      setIsMasterOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar
        className="
          bg-emerald-500 
          text-white 
          rounded-tr-3xl rounded-br-3xl
          shadow-2xl 
          border-r border-emerald-600/40
          backdrop-blur-xl
        "
      >
        <SidebarContent className="gap-4 pt-6">

          {/* HEADER */}
          <SidebarHeader className="px-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="
                w-12 h-12 rounded-2xl 
                bg-white/20 
                flex items-center justify-center
                shadow-md backdrop-blur-sm
              ">
                <Wallet className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1 className="text-lg font-semibold drop-shadow-sm">Akunting</h1>
                <p className="text-xs opacity-80">System</p>
              </div>
            </div>

            {user && (
              <div className="
                px-4 py-3 mb-2 
                rounded-xl 
                bg-white/15 
                shadow-inner backdrop-blur-md 
                text-white
              ">
                <p className="text-[11px] opacity-80 mb-0.5">Logged in as</p>
                <p className="font-semibold tracking-wide">{user.name}</p>
              </div>
            )}
          </SidebarHeader>

          <SidebarSeparator className="opacity-20 mx-4" />

          {/* MENU GROUP */}
          <SidebarGroup className="px-4">
            <SidebarGroupLabel className="text-white/80 text-sm">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 mt-2">

                {/* DASHBOARD */}
                <SidebarMenuItem>
                  <NavLink to="/dashboard">
                    <SidebarMenuButton
                      isActive={location.pathname === "/dashboard"}
                      className={cn(
                        "rounded-xl px-3 py-2 text-white/90 hover:text-white",
                        "hover:bg-white/10 transition-all duration-200",
                        "data-[active=true]:bg-white/20 shadow-sm"
                      )}
                    >
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>

                {/* MASTER DATA */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsMasterOpen(!isMasterOpen)}
                    className="rounded-xl px-3 py-2 hover:bg-white/10 text-white/90"
                  >
                    <Database />
                    <span>Master Data</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 ml-auto transition-transform duration-300",
                        isMasterOpen && "rotate-180"
                      )}
                    />
                  </SidebarMenuButton>

                  {isMasterOpen && (
                    <SidebarMenuSub className="ml-6 mt-1 space-y-1">
                      {[
                        { key: "kategori", label: "Kategori" },
                        { key: "subkategori", label: "Sub Kategori" },
                        { key: "akun", label: "Akun" },
                      ].map((item) => (
                        <SidebarMenuSubItem key={item.key}>
                          <NavLink to={`/master/${item.key}`}>
                            <SidebarMenuSubButton
                              isActive={
                                location.pathname === `/master/${item.key}`
                              }
                              className={cn(
                                "rounded-lg px-3 py-2",
                                "text-white/80 hover:bg-white/10 hover:text-white",
                                "data-[active=true]:bg-white/20"
                              )}
                            >
                              {item.label}
                            </SidebarMenuSubButton>
                          </NavLink>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                {/* TRANSAKSI */}
                <SidebarMenuItem>
                  <NavLink to="/transaksi">
                    <SidebarMenuButton
                      isActive={location.pathname === "/transaksi"}
                      className="rounded-xl px-3 py-2 hover:bg-white/10 text-white/90 data-[active=true]:bg-white/20"
                    >
                      <Receipt />
                      <span>Transaksi</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* FOOTER FIXED */}
          <div className="absolute bottom-0 left-0 w-full px-4 pb-4">
            <SidebarSeparator className="opacity-20 mx-4 mb-3" />
            <SidebarFooter>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <NavLink to="/tutupbuku">
                    <SidebarMenuButton
                      className="rounded-xl px-3 py-2 hover:bg-white/10 text-white"
                    >
                      <Database />
                      <span>Tutup Buku</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="rounded-xl px-3 py-2 hover:bg-red-500/20 hover:text-red-200 transition-all"
                  >
                    <LogOut />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </div>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
