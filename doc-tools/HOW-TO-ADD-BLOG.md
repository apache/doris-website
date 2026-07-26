# How to Add a First-Party Blog Post

This guide explains how an Agent should add a complete, first-party blog post to the Apache Doris website after receiving the original article as a Markdown file. A first-party post stores and renders the full article in this repository. It does not redirect readers to another website.

## Scope

Use this guide when:

- the input is a complete Markdown article;
- the article should be published under `https://doris.apache.org/blog/<slug>`;
- the article text and images should be maintained in this repository.

Do not use the external-post pattern for this task. A first-party post must not define `externalLink`, import `BlogLink` or `SeeMore`, or replace the article body with a link to another website.

## Files involved

Every first-party post requires:

```text
blog/<slug>.md
static/images/blogs/<slug>/cover.<ext>
static/images/blogs/<slug>/<content-image>.<ext>
```

The following files require changes only when the post should appear in the corresponding featured area:

```text
src/components/recent-blogs/recent-blogs.data.ts
src/constant/newsletter.data.ts
```

The Blog page discovers files under `blog/` automatically. Do not add a sidebar entry or edit `docusaurus.config.js` for a normal post.

## Required input

Before adding the post, collect or derive the following information:

| Item | Required | Notes |
| --- | --- | --- |
| Markdown source | Yes | The complete article body |
| Title | Yes | Use the article title unless the requester supplies a publishing title |
| Summary | Yes | One or two concise sentences for Blog cards |
| Description | Yes | A search-friendly description of the article |
| Publication date | Yes | Use `YYYY-MM-DD` |
| Author | Yes | Use the format described below |
| Tag | Yes | Prefer an existing Blog category |
| Cover image | Yes | A horizontal image used by Blog cards |
| Content images | When referenced | Every local image used by the article |
| Keywords | Recommended | A short list of specific search terms |
| Featured placement | Optional | Recent posts, Newsletter, or Blog header |

If the requester has not supplied a slug, summary, description, keywords, or image alt text, derive them from the article. Do not invent an author, organization, publication date, technical result, or product claim. Ask for missing factual information when it cannot be established from the source material.

## Step 1: Inspect the source

Read the entire Markdown file and inventory:

- existing front matter;
- local image references;
- remote image references;
- relative links;
- HTML, JSX, imports, or other MDX-only syntax;
- the original title, author, organization, and publication date.

Use this inventory to determine which article file, image files, and optional homepage entries must be added or updated.

## Step 2: Choose the file name and URL

Create the article at:

```text
blog/<slug>.md
```

Use a lowercase, descriptive, hyphen-separated slug:

```text
blog/building-a-real-time-analytics-platform.md
```

The resulting site URL is normally:

```text
/blog/building-a-real-time-analytics-platform
```

Keep the slug short enough to read and specific enough to identify the article. Avoid dates, marketing filler, underscores, spaces, and unnecessary stop words. Do not reuse the file name or URL of an existing article.

If the article already has a published Doris URL, preserve that URL whenever possible. Do not rename an existing post without checking inbound links and redirects.

Use `.md` for standard Markdown. Use `.mdx` only when the article needs JSX, React component imports, or another MDX feature.

## Step 3: Add front matter

Place front matter at the start of the article:

```yaml
---
title: 'Building a Real-Time Analytics Platform with Apache Doris'
summary: 'Learn how to build a real-time analytics platform with Apache Doris, from data ingestion and modeling to query optimization.'
description: 'This article explains how to build a real-time analytics platform with Apache Doris and covers architecture, ingestion, modeling, and optimization.'
keywords:
  - 'Apache Doris'
  - 'real-time analytics'
  - 'data warehouse'
date: '2026-07-26'
author: 'Company Name · Author Name'
tags:
  - 'Best Practice'
image: '/images/blogs/building-a-real-time-analytics-platform/cover.png'
---
```

Use the following fields:

| Field | Requirement |
| --- | --- |
| `title` | Required. Use a clear, specific article title. |
| `summary` | Required. The custom Blog cards read this field directly. Keep it to one or two sentences. |
| `description` | Required. Describe the page accurately for search results and link previews. |
| `keywords` | Recommended. Use a short list of terms that appear naturally in the article. |
| `date` | Required. Use `YYYY-MM-DD` and confirm that it is the intended publication date. |
| `author` | Required. For contributed posts, use `Organization · Author`. Use `Apache Doris` for posts authored by the project as a whole. |
| `tags` | Required. Prefer one existing category, such as `Best Practice`, `Tech Sharing`, `Release Notes`, or `Glossary`. Do not create a near-duplicate tag. |
| `image` | Required. Use an absolute site path beginning with `/images/`. |
| `picked` | Optional. Set to `"true"` only for a post selected for the Blog header. |
| `order` | Required with `picked`. Controls the Blog header position. |

Do not add `externalLink` to a first-party post.

The repository contains more than one historical front matter style. New posts should use the YAML mapping shown above. Follow the exact field names consumed by the current Blog components.

### Featured Blog header

The Blog header uses `picked` and `order`:

```yaml
picked: "true"
order: "1"
```

`order: "1"` is the large lead story. Other picked posts appear in ascending order. Before changing these fields, inspect every current selection:

```bash
rg -n -B 6 -A 2 "'?picked'?:|\"picked\":" blog
rg -n -B 6 -A 2 "'?order'?:|\"order\":" blog
```

Maintain one unique `order: "1"` and a contiguous featured sequence. When a new post enters the header, update the existing orders and remove `picked` and `order` from any post leaving the selection. Do not remove the old article itself.

## Step 4: Add the ASF license header

Place the Apache Software Foundation license comment immediately after the front matter:

```html
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->
```

Keep the comment out of the rendered article. Do not place article content inside it.

## Step 5: Add the article body

Put the complete article body after the license comment. The page already renders `title`, so begin the body with an introduction or an `##` heading. Do not repeat the title as an `#` heading.

Keep the source article's heading hierarchy, links, code blocks, tables, lists, and other Markdown content in this file. Update image references as described in the next section. Do not add the imports used by external-link stubs. A `<!-- truncate -->` marker is not required because the Blog list uses the front matter `summary`.

## Step 6: Add images

Create one image directory for the article:

```text
static/images/blogs/<slug>/
```

Example:

```text
static/images/blogs/building-a-real-time-analytics-platform/
├── cover.png
├── architecture.png
└── benchmark-results.png
```

Use lowercase, descriptive, hyphen-separated file names. Avoid spaces and generic names such as `image1.png`.

Reference content images from Markdown with absolute site paths:

```md
![Apache Doris real-time analytics architecture](/images/blogs/building-a-real-time-analytics-platform/architecture.png)
```

Do not use source-machine paths or paths relative to the Markdown file:

```md
<!-- Incorrect -->
![Architecture](../static/images/blogs/example/architecture.png)
![Architecture](/Users/name/Desktop/architecture.png)
```

Every image must have useful alt text that describes its content or purpose. Use empty alt text only for a purely decorative image.

Set the cover in front matter:

```yaml
image: '/images/blogs/<slug>/cover.png'
```

A horizontal cover works best with the current cards. Recent Blog covers commonly use an aspect ratio close to `1800 × 766`.

When the supplied Markdown references images:

1. locate every referenced local file;
2. copy it into the article image directory;
3. give it a stable, descriptive name;
4. update the Markdown reference;
5. verify that the file name and extension match exactly, including case.

Do not silently omit a missing image. If a remote image must be stored in the repository, place it in the same article image directory and replace its remote reference with the corresponding `/images/blogs/<slug>/...` path.

## Step 7: Update optional homepage placements

Adding the file under `blog/` is enough to add it to the Blog page. The following changes are conditional.

### Recent posts

If the post should appear in the Recent posts section, edit:

```text
src/components/recent-blogs/recent-blogs.data.ts
```

Add the post with its internal URL:

```ts
{
    label: 'Building a Real-Time Analytics Platform with Apache Doris',
    link: '/blog/building-a-real-time-analytics-platform',
},
```

Keep the configured list length and ordering consistent with the surrounding file. At the time of writing, the list contains four posts in newest-first order. Remove the oldest entry when adding a new one if the design still expects four.

### Newsletter carousel

If the post should appear in the Newsletter carousel, edit:

```text
src/constant/newsletter.data.ts
```

Add:

```ts
{
    tags: ['Best Practice'],
    title: 'Building a Real-Time Analytics Platform with Apache Doris',
    content: `Learn how to build a real-time analytics platform with Apache Doris, from data ingestion and modeling to query optimization.`,
    to: '/blog/building-a-real-time-analytics-platform',
    image: 'blogs/building-a-real-time-analytics-platform/cover.png',
},
```

The carousel image path is relative to `static/images/` and therefore omits the leading `/images/`:

```text
Front matter: /images/blogs/<slug>/cover.png
Newsletter:    blogs/<slug>/cover.png
```

Keep the carousel length and ordering consistent with the current file. At the time of writing, it contains four items in newest-first order.

### Blog header

Use the `picked` and `order` front matter fields described earlier. This placement is independent of Recent posts and the Newsletter carousel. A post can appear in any combination of the three areas.

## Step 8: Leave unrelated files unchanged

For a normal first-party English Blog post:

- do not edit `sidebars.ts` or any versioned sidebar;
- do not add the post to `docs/` or `versioned_docs/`;
- do not edit `versions.json`;
- do not edit `docusaurus.config.js`;
- do not create a redirect unless preserving or moving an existing URL;
- do not create a localized copy unless the task includes translation.

Update other files only when the article changes or references an existing route, asset, component, or navigation item.

## Step 9: Do not run a build

After adding the Blog post and its required assets, do not run a local site build. Commands such as `yarn build` are not required for this workflow.
