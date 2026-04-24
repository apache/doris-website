---
title: "Fixture: i18n sync only English"
description: "This fixture intentionally ships only the English current-version copy so the i18n-sync lint reports missing zh-CN, missing 4.x, and the Japanese candidate."
---

# Fixture: i18n sync only English

This doc exists only in English `current`. The i18n sync lint should report:

- `i18n-sync-version-missing` for the 4.x counterpart
- `i18n-sync-locale-missing` for the zh-CN counterpart
- `i18n-sync-locale-candidate` for the Japanese candidate
