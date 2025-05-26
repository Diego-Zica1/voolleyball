
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { VolleyballIcon } from "./VolleyballIcon";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    // Só mostra "Atributos" para admin
    ...(user?.isAdmin ? [{ name: "Atributos", path: "/atributos" }] : []),
    { name: "Times", path: "/times" },
    { name: "Contabilidade", path: "/contabilidade" },
    { name: "Placar", path: "/placar" },
  ];

  // Add admin link only if user is admin
  if (user?.isAdmin) {
    navItems.push({ name: "Admin", path: "/admin" });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <VolleyballIcon className="h-8 w-8 text-volleyball-purple soft-bounce" />
            <h1 className="text-xl font-bold">Vôolleyball</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path) 
                    ? "bg-volleyball-purple text-white" 
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <ModeToggle />
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm font-medium">{user.username}</span>
                <Button variant="outline" size="sm" onClick={() => signOut()}>Sair</Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mt-3 pt-3 border-t md:hidden">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md ${
                    isActive(item.path) 
                      ? "bg-volleyball-purple text-white" 
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <Button variant="outline" size="sm" onClick={() => signOut()} className="mt-2">
                  Sair ({user.username})
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
