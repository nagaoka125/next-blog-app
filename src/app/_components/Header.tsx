"use client";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMountain, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const router = useRouter();
  const { isLoading, session } = useAuth();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 shadow-xl">
      <div className="bg-blue-950 py-3 shadow-inner">
        <div
          className={twMerge(
            "mx-4 max-w-5xl md:mx-auto",
            "flex items-center justify-between",
            "text-white"
          )}
        >
          <div>
            <Link 
              href="/" 
              className="group flex items-center text-xl font-extrabold tracking-tighter transition-all hover:opacity-90"
            >
              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 shadow-inner group-hover:bg-white/20 transition-all">
                <FontAwesomeIcon icon={faMountain} className="text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="bg-linear-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Blog App
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-x-8 text-sm font-semibold uppercase tracking-widest">
            {!isLoading && (
              session ? (
                <button
                  onClick={logout}
                  className="group flex items-center gap-x-2 text-white hover:text-white transition-all duration-300"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="group-hover:-translate-x-1 transition-transform" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link 
                  href="/login" 
                  className="relative py-1 transition-all hover:text-blue-400 group"
                >
                  Login
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-400 transition-all group-hover:w-full"></span>
                </Link>
              )
            )}
            
            <Link 
              href="/about" 
              className="relative py-1 transition-all hover:text-blue-400 group"
            >
              About
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-400 transition-all group-hover:w-full"></span>
            </Link>

            {session && (
              <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-sm">
                <FontAwesomeIcon icon={faUser} className="text-xs text-blue-300" />
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;