import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type NavLink = { href: string; label: string };

export default function MobileMenu({ links, account }: { links: NavLink[]; account: NavLink }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    // Lets the header switch to dark text while the cream menu covers the hero photo.
    document.documentElement.dataset.menu = 'open';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      delete document.documentElement.dataset.menu;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Rendered into <body>: the header's backdrop blur would otherwise trap the
  // fixed overlay inside the header. z-20 keeps it just under the sticky header (z-30).
  const overlay = (
    <nav
      id="mobile-nav"
      aria-label="Mobile"
      hidden={!open}
      className="fixed inset-0 z-20 flex flex-col justify-end bg-paper px-4 pt-24 pb-10 lg:hidden"
    >
      <ol className="space-y-2">
        {links.map((link, i) => (
          <li key={link.href} className="flex items-baseline gap-4 border-b border-line pb-2">
            <span className="eyebrow w-6">{String(i + 1).padStart(2, '0')}</span>
            <a href={link.href} onClick={() => setOpen(false)} className="font-display text-5xl">
              {link.label}
            </a>
          </li>
        ))}
      </ol>
      <a href={account.href} className="mt-8 text-sm font-medium underline underline-offset-4">
        {account.label}
      </a>
    </nav>
  );

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-1 text-sm font-medium"
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
