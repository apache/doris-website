import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import "../../utils/proxiedGenerated";
import LocalSearchBar from "./SearchBar";
import AlgoliaSearchBar from "@docusaurus/theme-search-algolia/lib/theme/SearchBar";

// Env-gated swizzle: render Algolia's DocSearch bar when USE_ALGOLIA was set at
// build time (surfaced via customFields.useAlgolia), otherwise the existing
// local search bar. Both modules are imported unconditionally — they only run
// their themeConfig-dependent hooks when actually mounted, so the unused branch
// is inert.
export default function SearchBar(props) {
  const { siteConfig } = useDocusaurusContext();
  return siteConfig.customFields?.useAlgolia ? (
    <AlgoliaSearchBar {...props} />
  ) : (
    <LocalSearchBar {...props} />
  );
}
