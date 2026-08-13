export type V4NavItem = { key: string; label: string; href: string; icon: string };

export const NAV_ITEMS: V4NavItem[] = [
  { key: 'today',     label: '오늘',    href: '/',           icon: 'PenLine' },
  { key: 'dashboard', label: '대시보드', href: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'ledger',    label: '거래원장', href: '/ledger',    icon: 'Table2' },
  { key: 'purpose',   label: '목적통장', href: '/purpose',   icon: 'PiggyBank' },
  { key: 'assets',    label: '자산',    href: '/assets',    icon: 'Wallet' },
  { key: 'recurring', label: '예상 항목', href: '/recurring', icon: 'Repeat' },
  { key: 'settings',  label: '설정',    href: '/settings',  icon: 'Settings' },
];

export function isNavActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
