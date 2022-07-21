import React from "react";
import {
  useNavbarMobileSidebar,
  useThemeConfig,
} from "@docusaurus/theme-common";
import NavbarItem from "@theme/NavbarItem";
import GitHubButton from "react-github-button";

function useNavbarItems() {
  // TODO temporary casting until ThemeConfig type is improved
  return useThemeConfig().navbar.items;
}
// The primary menu displays the navbar items
export default function NavbarMobilePrimaryMenu() {
  const mobileSidebar = useNavbarMobileSidebar();
  // TODO how can the order be defined for mobile?
  // Should we allow providing a different list of items?
  const items = useNavbarItems();
  return (
    <>
      <ul className="menu__list">
        {items.map((item, i) => (
          <NavbarItem
            mobile
            {...item}
            onClick={() => mobileSidebar.toggle()}
            key={i}
          />
        ))}
      </ul>
      <span className="github-btn-mobile">
        <GitHubButton
          type="stargazers"
          size="large"
          namespace="apache"
          repo="doris"
        />
      </span>
    </>
  );
}
