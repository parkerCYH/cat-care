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
  // issue #8: /weight/chart is the spec's default landing page for this feature
  // ("拆成 /weight/chart(預設)與 /weight/table"); /weight/table is reached from within
  // the chart page, not the hamburger menu, to keep the menu to one entry per feature.
  { label: '體重歷史', path: '/weight/chart' },
  { label: '點滴歷史', path: '/fluid-injection/table' },
  { label: '驗血歷史', path: '/bloodwork/table' },
  // 票 25 — 聊天(票 15 定案:獨立導覽入口,不掛在任何貓咪詳情頁底下)
  { label: '聊天', path: '/chat' },
  { label: '貓咪管理', path: '/cats' },
];
