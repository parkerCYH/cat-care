export interface NavItem {
  label: string;
  path: string;
}

/**
 * Hamburger menu items (issue #4: hamburger shell, no bottom tab bar). Phase-1 feature
 * agents should append their top-level entry point here as they land their routes —
 * e.g. { label: '排便歷史', path: '/bowel/table' }, { label: '體重歷史', path: '/weight/table' },
 * { label: '貓咪管理', path: '/cats' }. Keep it to top-level destinations only; nested
 * routes (edit/detail/new) are reached from within a feature, not from this menu.
 */
export const navItems: NavItem[] = [
  { label: '首頁', path: '/' },
  // Calendar is the 預設 (default) view per issue #7's resolution — table, detail, and
  // edit are reached from within the calendar view rather than getting their own entries.
  { label: '排便歷史', path: '/bowel/calendar' },
];
