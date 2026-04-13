<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Apache Doris Website

Source code for [doris.apache.org](https://doris.apache.org), built with [Docusaurus 3](https://docusaurus.io/).

## Quick Start

### Prerequisites

- Node.js >= 18
- Yarn

### Local Development

Use `local_dev.sh` to run the site locally. It handles dependency installation, version filtering, and memory settings automatically.

```bash
# Start English dev server (default: only 'current' version, 2 GB memory)
./local_dev.sh

# Start Chinese dev server
./local_dev.sh start-zh

# Start on a custom port
./local_dev.sh start --port 8080

# Build a specific doc version
./local_dev.sh start --versions "4.x"

# Build English docs (production build)
./local_dev.sh build

# Build all locales (en + zh-CN)
./local_dev.sh build-all

# Clean build artifacts and caches
./local_dev.sh clean
```

Run `./local_dev.sh help` for all available commands and options.

### Production Build

```bash
export NODE_OPTIONS=--max-old-space-size=8192
yarn install
yarn docusaurus build --locale en --locale zh-CN
```

The output is generated in the `build/` directory.

## Directory Structure

```
.
├── docs/                         # Current (dev) version docs (English)
├── versioned_docs/
│   ├── version-4.x/              # 4.x version docs (English)
│   ├── version-3.x/              # 3.x version docs (English)
│   └── version-2.1/              # 2.1 version docs (English)
├── i18n/zh-CN/
│   └── docusaurus-plugin-content-docs/
│       ├── current/              # Current (dev) version docs (Chinese)
│       ├── version-4.x/          # 4.x version docs (Chinese)
│       ├── version-3.x/          # 3.x version docs (Chinese)
│       └── version-2.1/          # 2.1 version docs (Chinese)
├── blog/                         # Blog posts
├── community/                    # Community docs
├── src/                          # React components and pages
├── static/                       # Static assets (images, JS, CSS)
├── sidebars.ts                   # Sidebar for current (dev) docs
├── versioned_sidebars/           # Sidebar files per version
│   ├── version-4.x-sidebars.json
│   ├── version-3.x-sidebars.json
│   └── version-2.1-sidebars.json
├── sidebarsCommunity.json        # Sidebar for community docs
├── versions.json                 # Active doc versions
├── docusaurus.config.js          # Docusaurus configuration
└── local_dev.sh                  # Local development helper script
```

## Contributing Documentation

For general contribution guidelines, see:

- [How to Contribute](https://doris.apache.org/community/how-to-contribute/contribute-to-doris)
- [How to Contribute Docs](https://doris.apache.org/community/how-to-contribute/contribute-doc)
- [Docs Format Specification](https://doris.apache.org/community/how-to-contribute/docs-format-specification)

### Editing Docs

When modifying docs, you typically need to update **both the English and Chinese versions** in the corresponding directories:

| Version | English | Chinese | Sidebar |
|---------|---------|---------|---------|
| Current (dev) | `docs/` | `i18n/zh-CN/.../current/` | `sidebars.ts` |
| 4.x | `versioned_docs/version-4.x/` | `i18n/zh-CN/.../version-4.x/` | `versioned_sidebars/version-4.x-sidebars.json` |
| 3.x | `versioned_docs/version-3.x/` | `i18n/zh-CN/.../version-3.x/` | `versioned_sidebars/version-3.x-sidebars.json` |
| 2.1 | `versioned_docs/version-2.1/` | `i18n/zh-CN/.../version-2.1/` | `versioned_sidebars/version-2.1-sidebars.json` |

> **Note:** When adding a new page, you must also add its path to the corresponding sidebar file, otherwise it will not appear in the navigation.

### Editing Blog Posts

Blog posts are located in the `blog/` directory. Submit a PR to add or modify blog content.

### Editing Community Docs

Community docs are in `community/`, with navigation controlled by `sidebarsCommunity.json`. Chinese community content lives under `i18n/zh-CN/docusaurus-plugin-content-docs-community/`.

### Images

All images are stored in `static/images/`. Use hyphens to separate words in filenames (e.g., `query-profile-example.png`).

```markdown
![Description of the image](/images/my-screenshot.png)
```

## CI / Deployment

The site is deployed via GitHub Actions:

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `cron-deploy-website.yml` | Daily at 01:00 AM | Syncs from Doris master branch and deploys |
| `manual-deploy-website.yml` | Manual | Deploy from a specified branch |
| `build-check.yml` | On PR | Validates the build passes (incrementally by detected version) |
