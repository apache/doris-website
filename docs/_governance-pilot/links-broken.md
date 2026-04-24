---
title: "Fixture: broken links"
description: "This fixture intentionally contains broken internal links and missing anchors to trigger the blocking changed-only link gate."
---

# Fixture: broken links

## Missing internal file

See [this missing doc](./does-not-exist.md) which should trigger the
internal-file-missing rule.

## Missing anchor in existing doc

See [missing anchor](../gettingStarted/what-is-apache-doris.md#this-anchor-does-not-exist)
which should trigger the missing-anchor rule.

## Missing route

Also [this route](/docs/this-route-does-not-exist) should not resolve.

## External link (report-only today)

See the [example external link](https://this-domain-absolutely-does-not-exist-doris-governance.invalid/some-page).
