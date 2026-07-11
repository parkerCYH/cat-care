import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CatSwitcher } from './CatSwitcher';
import { navItems } from '@/routes/navConfig';

/**
 * Hamburger-menu shell (issue #4 resolution): sticky top bar (48–56px) with the cat
 * switcher on the left and a hamburger icon on the right (>=48px touch target); no
 * bottom tab bar. Menu items open in a full-height slide-over panel.
 */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
        <CatSwitcher />
        <button
          type="button"
          aria-label="開啟選單"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex h-12 w-12 items-center justify-center text-2xl"
        >
          ☰
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            aria-label="關閉選單"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-64 max-w-[80vw] bg-white p-4 shadow-xl">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block min-h-[48px] rounded-lg px-3 py-3 text-sm font-medium ${
                        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
