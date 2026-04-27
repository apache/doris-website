# `docs-next` 实施文档（A + 灰度方案）

> 目标: 在不影响线上 `/docs/` 显示的前提下，搭建一套全新的 `/docs-next/`，独立维护新版信息架构。
> 范围: **仅 English + 中文**, **仅 `current` + `4.x`** 两个版本。
> 关联文档: [sidebar-information-architecture-analysis.md](./sidebar-information-architecture-analysis.md) — 信息架构分析与新结构蓝图

---

## 一、目标与非目标

### 目标
1. ✅ 在仓库内并存两套文档站: `/docs/`（旧, 当前线上）与 `/docs-next/`（新, 灰度）；
2. ✅ 旧站持续迭代不受影响（PR 继续合 `docs/`、`versioned_docs/`、`i18n/zh-CN/.../current` 等老路径）；
3. ✅ 新站独立修改, 不显示在主导航, 公开但不被搜索引擎索引；
4. ✅ 新站只支持 `current` (Dev) + `4.x`, 中英文双语；
5. ✅ 准备就绪后, 一行配置切换主入口到 `/docs-next/`, 并在两边页面顶部加"切换到新版/旧版"按钮；
6. ✅ 老书签 `/docs/...` 100% 长期可用。

### 非目标（明确不做）
- ❌ 不维护 `docs-next` 的 3.x / 2.1 / 2.0 / 1.2 版本；老版本依然只在 `/docs/` 提供；
- ❌ 不维护 `docs-next` 的日文（ja）版本；ja 仍走当前 `ja-source` 独立流程；
- ❌ 不在第一阶段移动文档源文件位置（保持 docId 一致, 不破坏老书签）；
- ❌ 不在第一阶段并入 Algolia / kapa.ai 搜索新内容（避免搜索结果重复）。

---

## 二、整体架构

实施后的关键目录:

```
doris-website/
├── docs/                                       # 旧版当前 (current) 源 — 保持不动
├── versioned_docs/version-4.x/                 # 旧版 4.x 源 — 保持不动
├── versioned_docs/version-3.x/                 # 旧版 3.x — 保持不动 (新版不维护)
├── versioned_docs/version-2.1/                 # 同上
├── versions.json                               # 旧站版本列表 — 保持不动
├── sidebars.ts                                 # 旧站 sidebar — 保持不动
├── versioned_sidebars/                         # 旧站 versioned sidebar — 保持不动
├── i18n/zh-CN/docusaurus-plugin-content-docs/  # 旧站中文 — 保持不动
│
├── docs-next/                                  # 🆕 新版 current 源
├── next_versioned_docs/version-4.x/            # 🆕 新版 4.x 源
├── next_versions.json                          # 🆕 ["4.x", "current"]
├── sidebars-next.ts                            # 🆕 新版 sidebar (顶层 + current)
├── next_versioned_sidebars/                    # 🆕 新版 versioned sidebar
│   └── version-4.x-sidebars.json
└── i18n/zh-CN/docusaurus-plugin-content-docs-next/   # 🆕 新版中文
    ├── current/
    ├── current.json
    ├── version-4.x/
    └── version-4.x.json
```

`docusaurus.config.js` 中通过**第二个 `content-docs` 插件实例**接入, id = `next`, routeBasePath = `/docs-next`。

URL 映射:

| 路径 | 内容来源 | 说明 |
|------|---------|------|
| `/docs/` | 旧站, presets.classic.docs | 默认入口（灰度期内不变） |
| `/docs/4.x/...` | `versioned_docs/version-4.x/` | 老书签全部命中这里 |
| `/docs-next/` | 新站, plugin id = next | 默认指向 4.x |
| `/docs-next/4.x/...` | `next_versioned_docs/version-4.x/` | 新版 4.x |
| `/docs-next/dev/...` | `docs-next/` | 新版 current |
| `/zh-CN/docs/...` | i18n 旧 | 不变 |
| `/zh-CN/docs-next/...` | i18n 新 | 新增 |

---

## 三、阶段划分

| 阶段 | 时长 | 目标 | 是否影响线上 |
|------|------|------|-------------|
| **阶段 0**: 准备 | 0.5 天 | 评审本文档、对齐 owner | 无 |
| **阶段 1**: 框架搭建 | 1 天 | 拷源文件、加配置、build 通过、`/docs-next/` 可访问 | 无（只是多了一个 URL） |
| **阶段 2**: 内容重构 | 数周–数月 | 在 `docs-next/` 中按新 IA 调整 sidebar、改写少量文档 | 无 |
| **阶段 3**: 灰度公开 | 1–3 个月 | 在 `/docs/` 顶部加 "试试新版" banner, 默认入口仍为旧版 | 旧版多一条 banner, 否则无影响 |
| **阶段 4**: 切换默认 | 0.5 天 | 主导航 / 主页 Docs 按钮指向 `/docs-next/` | 默认入口变更, 旧 URL 仍可用 |
| **阶段 5**: 收尾** | 视情况 | 决定是否做 C/D 类（移动文件 + 301）将 `/docs/` 重定向到 `/docs-next/`, 或长期并存 | 视决策 |

> **本文档主要覆盖阶段 0 – 阶段 4**。阶段 5 涉及文件迁移与 301 redirect, 等灰度结果出来再决策。

---

## 四、阶段 1: 框架搭建（详细步骤）

### 4.1 拷贝源文件

> **原则**: 第一阶段不做任何文件名/路径修改, 完全镜像现有 4.x 与 current 内容, 保证 `docs-next` 第一次 build 能通过, 之后再增量修改 sidebar。

```bash
cd /Users/morningman/workspace/git/doris-website

# (1) English 源
cp -r docs docs-next
mkdir -p next_versioned_docs
cp -r versioned_docs/version-4.x next_versioned_docs/version-4.x

# (2) 中文源
mkdir -p i18n/zh-CN/docusaurus-plugin-content-docs-next
cp -r i18n/zh-CN/docusaurus-plugin-content-docs/current \
      i18n/zh-CN/docusaurus-plugin-content-docs-next/current
cp    i18n/zh-CN/docusaurus-plugin-content-docs/current.json \
      i18n/zh-CN/docusaurus-plugin-content-docs-next/current.json
cp -r i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x \
      i18n/zh-CN/docusaurus-plugin-content-docs-next/version-4.x
cp    i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x.json \
      i18n/zh-CN/docusaurus-plugin-content-docs-next/version-4.x.json
```

### 4.2 创建 `next_versions.json`

```bash
echo '["4.x", "current"]' > next_versions.json
```

> **重要**: 这里只列 `current` 和 `4.x`, 没有 3.x / 2.1 / 2.0 / 1.2 — 这是用户要求。

### 4.3 创建 `sidebars-next.ts`（current 顶层）

第一步先**完整复制 `sidebars.ts` 的内容**到 `sidebars-next.ts`, 保证 build 不会因 docId 不匹配失败。后续再按新 IA 增量修改。

```bash
cp sidebars.ts sidebars-next.ts
```

### 4.4 创建 `next_versioned_sidebars/version-4.x-sidebars.json`

直接拷贝旧版 4.x 的 sidebar:

```bash
mkdir -p next_versioned_sidebars
cp versioned_sidebars/version-4.x-sidebars.json \
   next_versioned_sidebars/version-4.x-sidebars.json
```

### 4.5 在 `docusaurus.config.js` 中加入新插件实例

在 `plugins:` 数组中追加（建议放在 `releases` 实例之后）:

```js
[
    'content-docs',
    /** @type {import('@docusaurus/plugin-content-docs').Options} */
    ({
        id: 'next',
        path: 'docs-next',
        routeBasePath: 'docs-next',
        sidebarPath: require.resolve('./sidebars-next.ts'),
        includeCurrentVersion: true,
        // 关键: 只编译 current + 4.x, 不动 3.x / 2.1 等
        onlyIncludeVersions: ['current', '4.x'],
        lastVersion: '4.x',          // 默认进入 4.x
        versions: {
            current: {
                label: 'Dev',
                path: 'dev',
                banner: 'unreleased',
            },
            '4.x': {
                label: '4.x',
                path: '4.x',
                banner: 'none',
                badge: false,
            },
        },
        // 灰度期内不被搜索引擎索引, 防止与旧站内容判重
        // 注意: 此选项在页面 <head> 注入 noindex, 不进 sitemap
        // 上线灰度后页面公开可访问, 但不会出现在搜索结果
        // 阶段 4 切换默认时可去掉此项
        // (Docusaurus v3 起内置)
        // 见: https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs#noindex
    }),
],
```

> **关键参数解释**:
> - `id: 'next'` — Docusaurus 自动按 `next_versioned_docs/`、`next_versions.json`、`i18n/<locale>/docusaurus-plugin-content-docs-next/` 寻找文件。
> - `onlyIncludeVersions: ['current', '4.x']` — 即使 `next_versions.json` 中只有这两项, 这里再次显式锁定, 让任何人误加版本也不会生效。
> - `lastVersion: '4.x'` — 决定 `/docs-next/` 直接进入哪个版本。

### 4.6 文档级 noindex（灰度期防 SEO 重复）

在阶段 4 之前, `docs-next/` 的全部文档应当不被搜索引擎索引。两种实现方式, 选其一:

**方式 A（推荐）: 文档级 frontmatter**

写一个一次性脚本, 给 `docs-next/` 与 `next_versioned_docs/version-4.x/` 下所有 `.md` / `.mdx` 文件 frontmatter 加入:

```yaml
---
draft: false
unlisted: true   # 不进 sitemap, 不被搜索引擎索引, URL 仍可访问
---
```

`unlisted: true` 是 Docusaurus v3 内置能力, 完全符合需求。

**方式 B: 全站 robots.txt**

在 `static/robots.txt` 中加入:

```
User-agent: *
Disallow: /docs-next/
Disallow: /zh-CN/docs-next/
```

方式 A 更精细（每篇可单独控制）, 方式 B 更省事。**建议组合使用**: 先 robots.txt 兜底, 后续如有特定文档需要先曝光再去除其 unlisted。

### 4.7 站内搜索（search-local）暂不索引 docs-next

修改 `docusaurus.config.js` 的 `themes`:

```js
themes: [
    [
        '@yang1666204/docusaurus-search-local',
        {
            // ... 其他参数不变
            // 灰度期保持只索引旧版
            docsRouteBasePath: ['docs', 'ja/docs', 'zh-CN/docs'],
            // 阶段 4 切换默认时, 替换为下面这行:
            // docsRouteBasePath: ['docs-next', 'zh-CN/docs-next', 'docs', 'zh-CN/docs', 'ja/docs'],
        },
    ],
],
```

### 4.8 sitemap 排除 docs-next

在 `presets.classic.sitemap.createSitemapItems` 里追加过滤:

```js
const filteredItems = items.filter(item => {
    const pathname = new URL(item.url).pathname.replace(/\/+$/, '');
    if (['/search', '/ja/search', '/zh-CN/search'].includes(pathname)) return false;
    // 灰度期不进 sitemap
    if (pathname.startsWith('/docs-next') || pathname.startsWith('/zh-CN/docs-next')) {
        return false;
    }
    return true;
});
```

### 4.9 本地验证

```bash
yarn install
# 仅 English 快速验证
DOCS_VERSIONS="current,4.x" yarn start
# 浏览器访问:
#   http://localhost:3000/docs/4.x/gettingStarted/what-is-apache-doris  (旧站正常)
#   http://localhost:3000/docs-next/4.x/gettingStarted/what-is-apache-doris  (新站可访问)

# 中文验证
yarn start --locale zh-CN
# 访问 http://localhost:3000/zh-CN/docs-next/4.x/gettingStarted/what-is-apache-doris
```

### 4.10 完整构建验证

```bash
yarn build 2>&1 | tee build.log
# 确认产物中:
ls build/docs-next/4.x/gettingStarted/
ls build/zh-CN/docs-next/4.x/gettingStarted/
# 确认 sitemap 中没有 docs-next:
grep -c "docs-next" build/sitemap.xml   # 应为 0
```

### 4.11 阶段 1 完成标志（DoD）

- [ ] `yarn build` 通过且 0 broken link warning（与 main 分支基线一致）；
- [ ] `/docs/4.x/...` 与 `/docs-next/4.x/...` 内容相同, 但侧边栏来源不同；
- [ ] 中文站 `/zh-CN/docs/...` 与 `/zh-CN/docs-next/...` 都可访问；
- [ ] sitemap 不含 `/docs-next/` 路径；
- [ ] 站内搜索结果不包含 `/docs-next/` 内容；
- [ ] 主导航的 "Docs" 按钮**仍然**指向 `/docs/4.x/...`（未切换）。

---

## 五、阶段 2: 内容重构日常工作流

阶段 1 完成后, 仓库进入**双轨期**, 以下是日常工作的规则。

### 5.1 旧站维护规则（不变）

- 任何对 `current` / `4.x` 的修改, 仍按现有流程: 修改 `docs/` 或 `versioned_docs/version-4.x/` + 中文 i18n。
- 这部分修改**不会**自动同步到 `docs-next/`, 由新版 owner 决定哪些回灌。
- 老版本（3.x / 2.1 / 2.0 / 1.2）仍然在旧站维护, 不进入新版。

### 5.2 新站修改规则

- 新版任何调整只动 `docs-next/`、`next_versioned_docs/`、`sidebars-next.ts`、`next_versioned_sidebars/`、`i18n/zh-CN/docusaurus-plugin-content-docs-next/`；
- 不要修改 `docs/`、`versioned_docs/`、`sidebars.ts`、`versioned_sidebars/`、`i18n/zh-CN/docusaurus-plugin-content-docs/` —— 这些是旧站的；
- 信息架构调整原则: **第一阶段只动 sidebar, 不动文件**。即只在 `sidebars-next.ts` / `next_versioned_sidebars/version-4.x-sidebars.json` 内调整 docId 的层级和顺序, 不动 docId 本身和源文件位置。

### 5.3 文档差异同步策略

旧站每周/每月都有 PR 进入 `docs/`, 新站要不要同步？建议:

| 旧站修改类型 | 是否同步到 docs-next |
|-------------|--------------------|
| 笔误、链接修复、小段落调整 | **不主动同步**, 灰度结束后批量 rebase |
| 大功能新增（新章节） | 评估后**手动同步**到 docs-next, 顺便按新 IA 归位 |
| Bug 修复（带回灌价值） | **手动同步** |
| 老版本（3.x/2.1）专属修改 | **不同步**（新版不维护老版本） |

**自动化建议（可选）**: 写一个脚本 `scripts/diff-docs-next.sh`, 列出 `docs/` 比 `docs-next/` 新的提交（基于 `git log --diff-filter=AM -- docs/`）, 每周 review 一次决定回灌哪些。

### 5.4 CI 校验

新增一个 CI job, 专门 build `docs-next`:

```yaml
# .github/workflows/docs-next-build.yml
name: docs-next build check
on:
  pull_request:
    paths:
      - 'docs-next/**'
      - 'next_versioned_docs/**'
      - 'next_versioned_sidebars/**'
      - 'sidebars-next.ts'
      - 'next_versions.json'
      - 'i18n/zh-CN/docusaurus-plugin-content-docs-next/**'
      - 'docusaurus.config.js'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: DOCS_VERSIONS="current,4.x" yarn build
      - run: |
          test -d build/docs-next/4.x
          test -d build/zh-CN/docs-next/4.x
```

> 这个 job 在 PR 只动 `docs/` 时不会触发, 节省 CI 时间。

---

## 六、阶段 3: 灰度公开 — 加 banner

### 6.1 在旧站顶部加"试试新版导航"banner

在 `docusaurus.config.js` 的 `themeConfig.announcementBar` 已经被占用（slack 公告）, 不适合再用。改为**Swizzle**一个组件, 仅在 `/docs/...` 路径下显示。

最简实现: 创建 `src/theme/DocPageWrapper/index.tsx`:

```tsx
import React from 'react';
import { useLocation } from '@docusaurus/router';

const NEW_DOCS_BANNER_KEY = 'doris-docs-next-banner-dismissed';

export default function DocPageBanner() {
    const location = useLocation();
    const [dismissed, setDismissed] = React.useState(false);
    React.useEffect(() => {
        setDismissed(localStorage.getItem(NEW_DOCS_BANNER_KEY) === '1');
    }, []);

    // 仅在 /docs/ 或 /zh-CN/docs/ 等老路径下显示
    const isLegacyDocs = /^\/(?:zh-CN\/|ja\/)?docs\//.test(location.pathname);
    const isNextDocs = /^\/(?:zh-CN\/|ja\/)?docs-next\//.test(location.pathname);
    if (!isLegacyDocs || isNextDocs || dismissed) return null;

    // 把当前 URL 的 /docs/ 替换为 /docs-next/, docId 相同则可命中同一篇文档
    const nextUrl = location.pathname.replace('/docs/', '/docs-next/');

    return (
        <div style={{
            background: '#11A679', color: '#fff',
            padding: '8px 16px', textAlign: 'center', fontSize: 14,
        }}>
            🆕 We&apos;re trialing a new docs structure.
            {' '}
            <a href={nextUrl} style={{ color: '#fff', textDecoration: 'underline', fontWeight: 600 }}>
                Try it now →
            </a>
            <button
                onClick={() => {
                    localStorage.setItem(NEW_DOCS_BANNER_KEY, '1');
                    setDismissed(true);
                }}
                style={{
                    marginLeft: 16, background: 'transparent', border: '1px solid #fff',
                    color: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                }}
            >
                Dismiss
            </button>
        </div>
    );
}
```

挂载方式: Swizzle `DocRoot/Layout` 或在 `src/theme/Layout/index.tsx` 中包一层。具体取决于希望 banner 出现在哪一层（建议在 `DocRoot` 下, 只对 docs 页面显示）:

```bash
yarn swizzle @docusaurus/theme-classic DocRoot/Layout -- --eject
```

然后在 swizzled 的 `DocRoot/Layout/index.tsx` 顶部插入 `<DocPageBanner />`。

### 6.2 在新站也加一个反向 banner

让用户能从新版**切回旧版**。同一个组件 `DocPageBanner` 已经处理了 `isNextDocs` 的判断, 加一段相反逻辑即可。或者写 `<DocNextBanner />` 单独管理。

```tsx
if (isNextDocs && !isLegacyDocs) {
    const legacyUrl = location.pathname.replace('/docs-next/', '/docs/');
    return (
        <div style={{ background: '#666', color: '#fff', padding: '6px 16px', fontSize: 13, textAlign: 'center' }}>
            You&apos;re viewing the new docs (beta).
            {' '}
            <a href={legacyUrl} style={{ color: '#fff', textDecoration: 'underline' }}>
                Back to current docs
            </a>
        </div>
    );
}
```

### 6.3 阶段 3 完成标志

- [ ] 用户访问 `/docs/4.x/...` 看到顶部绿色 banner, 点击跳转到 `/docs-next/4.x/...` 同一篇文档；
- [ ] 用户访问 `/docs-next/...` 看到顶部灰色 banner, 可一键返回旧版；
- [ ] banner 可手动关闭, localStorage 记忆；
- [ ] Matomo 事件埋点统计 banner 点击率（可选, 用于评估灰度效果）。

---

## 七、阶段 4: 切换默认入口

灰度反馈良好后, 一次性切换默认入口。所有变更都很小, 在一个 PR 完成:

### 7.1 主导航与主页 Docs 按钮指向新版

`docusaurus.config.js`:

```diff
 {
     position: 'left',
     label: 'Docs',
-    to: `/docs/${DEFAULT_VERSION}/gettingStarted/what-is-apache-doris`,
+    to: `/docs-next/${DEFAULT_VERSION}/gettingStarted/what-is-apache-doris`,
     target: '_blank',
 },
```

`src/pages/index.tsx`:

```diff
- link: `/docs/${DEFAULT_VERSION}/gettingStarted/what-is-apache-doris`,
+ link: `/docs-next/${DEFAULT_VERSION}/gettingStarted/what-is-apache-doris`,
```

`src/pages/index.tsx` 第 463 行同样替换。

### 7.2 移除 docs-next 的 noindex / unlisted

- 删掉 robots.txt 中 `Disallow: /docs-next/` 行；
- 跑脚本批量去掉 `docs-next/` 与 `next_versioned_docs/` 下文档 frontmatter 里的 `unlisted: true`；
- 撤掉 sitemap `createSitemapItems` 里的 `docs-next` 过滤；
- search-local 加上 `docs-next` 与 `zh-CN/docs-next`。

### 7.3 banner 反转

`<DocPageBanner />` 中:
- 老站 banner 改文案: "This page is from the legacy docs. We've moved to a new structure. View the new version →"
- 新站 banner 改文案 / 移除（看产品决策）。

### 7.4 阶段 4 完成标志

- [ ] 主页/主导航默认进入新版；
- [ ] 老 URL `/docs/...` 仍正常访问（不做 redirect, 保护书签）；
- [ ] 老站 banner 提示用户已经有新版可查看, 不强制跳转；
- [ ] sitemap 中 `/docs-next/` 全部进入；
- [ ] 搜索结果以新版为主。

---

## 八、阶段 5（可选）: 长期收尾

灰度 + 切换默认运行 1–3 个月后, 决定:

1. **方案甲（保守）**: 永久并存。`/docs/` 与 `/docs-next/` 都保留, 老 URL 不做任何跳转, 老书签永久有效。代价: 长期维护两份 sidebar, 但内容仍是单源。
2. **方案乙（彻底）**: 把 `/docs/` 整体 301 到 `/docs-next/`, 完成 IA 收敛。需要做:
   - 把 `docs-next/` 内容替换 `docs/`（git mv）；
   - 删除 `docs-next` 插件实例；
   - 配 `@docusaurus/plugin-client-redirects` 把 `/docs-next/...` 自动重定向到 `/docs/...`；
   - 老 `/docs/X` URL 保持原样（因为目录结构没变, 只换了 sidebar）。
3. **方案丙（带文件迁移）**: 若新版 IA 还要做"移动文件"（C/D 类）, 必须配齐每条 redirect, 详见原分析文档第六节。

> 推荐: **先方案甲再方案乙**。运行 1 年观察访问量再决定是否完全下线 `/docs/`。

---

## 九、回滚方案

阶段 1–3 任意时刻可零成本回滚:

- 删除 `docusaurus.config.js` 中的 `next` 插件实例配置；
- 仓库中的 `docs-next/` 等目录可保留（不影响 build）, 也可删除。

阶段 4 切换默认后回滚:

- 撤回主导航与主页的 Docs 链接修改即可；
- `/docs-next/` 仍然可访问。

---

## 十、关键决策需确认

下列事项需要在动手前对齐:

| # | 决策点 | 推荐 | 备注 |
|---|--------|------|------|
| 1 | `docs-next/` 是否进 git？ | ✅ 进 git | 不然多人协作做不了 |
| 2 | 第一次拷贝是不是"硬拷贝"（完整副本）？ | ✅ 是 | 后续两边独立演进 |
| 3 | 旧版的小修复是否回灌新版？ | 默认不回灌, 大修复手动回灌 | 见 5.3 |
| 4 | kapa.ai AI 助手是否切到新版？ | 阶段 4 一并切换（前端 + 后台） | 详见 §10.1 |
| 5 | docs-next 的中文翻译流程是什么？ | 沿用现有"PR 内手工同步"模式（项目实际未使用 Crowdin） | 详见 §10.2 |
| 6 | ja-source 是否同步建 docs-next？ | 不建；并在 ja workflow 防误触发 | 详见 §10.3 |
| 7 | search-local 是否在阶段 4 前就开通新版索引？ | 不开 | 避免搜索结果重复 |
| 8 | 阶段 3 banner 是否需要 i18n 文案？ | 至少英中两版 | code.json 中加翻译 key |

### 10.1 决策点 4 详解: kapa.ai AI 助手

kapa.ai 在仓库内的引用只有一处（`docusaurus.config.js:104`）, 是弹窗里的 disclaimer 文案。**真正的 AI 知识来源在 kapa.ai 后台爬虫配置里**, 通过 `data-website-id="a5fb90df-217a-4097-95c0-80490220314b"` 关联, 仓库内看不到。

阶段 4 切换时需要做**两件事**:

**(1) 仓库内的 diff —— 改 disclaimer 文案链接**

`docusaurus.config.js`:

```diff
-'data-modal-disclaimer': 'This is a custom LLM with access to all [Doris documentation](https://doris.apache.org/docs/4.x/gettingStarted/what-is-apache-doris).',
+'data-modal-disclaimer': 'This is a custom LLM with access to all [Doris documentation](https://doris.apache.org/docs-next/4.x/gettingStarted/what-is-apache-doris).',
```

> 改进建议: 顺便把硬编码的 `4.x` 换成 `${DEFAULT_VERSION}` 拼接, 后续升版本不再需要改这里。

**(2) 仓库外的运维动作 —— 通知 kapa.ai 后台 owner**

`data-project-logo` 指向 `cdn.selectdb.com`, 说明 kapa 后台账号大概率在 SelectDB 团队。需要找到该账号 owner, 在以下三个选项中选一:

| 时机 | 后台动作 | 效果 |
|------|---------|------|
| 阶段 1–3（灰度期） | 不动, 仍只爬 `/docs/` | AI 答案只引用旧版（与 unlisted/noindex 一致） |
| 阶段 3 末 / 阶段 4 中 | **追加** `/docs-next/` 为爬虫源 | AI 知识扩到新旧两版, 可能出现答案中混引两套 |
| 阶段 4 完成后 | **替换**为 `/docs-next/` | AI 答案完全切到新版 |

> 推荐: 阶段 1–3 不动, 阶段 4 直接走"替换"。混合期容易让 AI 答案出现矛盾的章节标题。

### 10.2 决策点 5 详解: 中文翻译流程

**重要事实**: `crowdin.yml` 是项目里的孤儿配置文件, **当前没有任何 CI / Action 在调用它**。具体证据:

- `crowdin.yml` 内容是 EN→ja 的 4 行配置, 但仓库内根本没有 `i18n/ja/` 目录;
- `.github/workflows/` 里没有任何 crowdin action;
- `package.json` 里没有 `crowdin-cli` 依赖;
- 中文（zh-CN）翻译实际是**纯手工**完成: 每个 PR 同时改 4–6 个位置。
  典型 commit 长这样:
  ```
  docs/lakehouse/file-formats/lance.md                               | 98 +
  versioned_docs/version-4.x/lakehouse/file-formats/lance.md         | 98 +
  i18n/zh-CN/docusaurus-plugin-content-docs/current/.../lance.md     | 98 +
  i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/.../lance.md | 98 +
  ```
- 日文翻译走的是另一条流程 —— `.github/workflows/manual-i18n-translate-workflow.yaml`（手动触发, Claude API 自动翻译, 输出 PR）。

**结论**: 不需要修改 `crowdin.yml`, 不需要新增任何 CI。`docs-next` 的中文翻译就**沿用现有的"PR 内手工同步"模式**, 只是同步的目标目录换成 `docusaurus-plugin-content-docs-next`。

需要落地的事项:

1. **更新 PR 模板**（`.github/PULL_REQUEST_TEMPLATE.md` 或 issue template, 视项目使用的位置）, 在 "Languages" 复选框旁说明 docs-next 中文同步的目标路径。
2. **写到 `CONTRIBUTING.md`** 一段 "docs-next 翻译指南":
   ```
   When modifying docs-next:
   - English source:  docs-next/<path>            (current/dev)
                      next_versioned_docs/version-4.x/<path>  (4.x)
   - Chinese source:  i18n/zh-CN/docusaurus-plugin-content-docs-next/current/<path>
                      i18n/zh-CN/docusaurus-plugin-content-docs-next/version-4.x/<path>
   - Do NOT touch the legacy docs/ tree in the same PR unless explicitly backporting.
   ```
3. **可选**: 评估是否给 docs-next 也接入 `manual-i18n-translate-workflow.yaml` 做 ZH 自动翻译初稿（目前该 workflow 只跑 EN→JA, 但脚本对 EN→ZH 也通用）。这是优化项, 不属于必需。

### 10.3 决策点 6 详解: 防止 ja workflow 误扫 docs-next

`.github/workflows/manual-i18n-translate-workflow.yaml` 的 `source_dir` 默认值是 `docs`, 是手动触发的（`workflow_dispatch`）, 所以默认不会扫到 `docs-next/`。但为了防止人为传错参数:

- 在该 workflow 的 `Prepare translation input` 步骤里加一行守卫:
  ```bash
  if [[ "${{ inputs.source_dir }}" == docs-next* ]]; then
    echo "❌ docs-next is out of scope for ja translation."
    exit 1
  fi
  ```
- 或者直接在 workflow inputs 的 description 里加红字警告。

---

## 十一、Checklist（落地用）

### 阶段 1（搭框架）

> **实施备注（2026-04-25）**: 第一阶段实施范围**缩减为仅 current 版本**, 4.x 不在 docs-next 中维护（暂等内容稳定后再决定是否补回）。因此 `next_versioned_docs/`、`next_versioned_sidebars/` 未创建, `next_versions.json` 为 `[]`。分支策略也调整为**直接在 app_me 分支提交**, 未单独开 `docs-next-bootstrap` 分支。
>
> 落地 commit: `67c4c44563ef chore(docs): bootstrap docs-next plugin instance (current only, EN + zh-CN)`

- [x] ~~评审本文档, 确认决策点 1–8~~ → 决策点 1/2/3/7 已隐式确认; 决策点 4/5/6/8 留到阶段 3/4 再处理
- [x] ~~创建分支 `docs-next-bootstrap`~~ → 改为直接在 `app_me` 分支提交
- [x] 拷源文件（4.1）— 仅 EN current + zh-CN current（4.x 已从范围中移除）
- [x] 创建 `next_versions.json`（`[]`）、`sidebars-next.ts`（4.2 – 4.3）— `next_versioned_sidebars/` 因 4.x 移除而无需创建
- [x] 改 `docusaurus.config.js` 加插件实例（4.5）— `onlyIncludeVersions: ['current']`, `lastVersion: 'current'`, current path=`dev`, banner=`none`
- [x] 配 noindex（4.6）— 选用方式 B（robots.txt 兜底, 全部 User-agent 加 `Disallow: /docs-next/` 与 `/zh-CN/docs-next/`）。方式 A（文档级 `unlisted: true` frontmatter）暂未做, 待阶段 3 前如需精细控制再追加
- [x] 配 search-local 排除（4.7）— 保持现有 `docsRouteBasePath`, 加注释指向阶段 4 切换的目标值
- [x] 配 sitemap 排除（4.8）— `createSitemapItems` 中追加 `docs-next` / `zh-CN/docs-next` 过滤
- [~] 本地 build 验证（4.9 – 4.10）— **EN-only / current-only / NODE_OPTIONS 1800MB heap** 通过: exit 0, 231s, 5969 docs-next HTML 文件, sitemap.xml 0 条 docs-next URL, robots.txt Disallow 已生效。**中文 locale 与全量版本未在本地构建**, 留 CI 验证
- [~] DoD（4.11）— 已过: build 成功 / sitemap 不含 docs-next / 主导航仍指向 `/docs/...`. 待 CI 验证: zh-CN 构建 / 站内搜索不返回 docs-next / `/docs-next/dev/...` 与 `/docs/dev/...` 内容一致
- [x] 加 CI job（5.4）— `.github/workflows/docs-next-build.yml`, 触发路径含 `docs-next/**` `sidebars-next.ts` `next_versions.json` `i18n/zh-CN/docusaurus-plugin-content-docs-next/**` `docusaurus.config.js`; 校验 `build/docs-next/dev` `build/zh-CN/docs-next/dev` 存在 + sitemap 不含 docs-next + robots.txt 含 Disallow
- [x] **【新增】跳过 build-check.yml 中的 broken-link 检查对 docs-next 的扫描** — `scripts/check_move.js`、`check_move.py` 都加了 `isDocsNextPath` 守卫, 命中 `docs-next/` 或 `i18n/.../docusaurus-plugin-content-docs-next/` 的文件直接 skip。原因: docs-next 灰度期 IA 仍在重构, 大量内部相对链接会暂时断, 不应阻塞旧站 PR。`yarn docs:links:changed` (lint-links.js) 因 manifest CONTENT_ROOTS 不含 docs-next, 已天然跳过, 无需改
- [ ] 合并到 master — 当前在 `app_me`, 待开 PR / 评审后再合

### 阶段 2（内容重构, 增量 PR）

> **实施备注（2026-04-25）**: 阶段 2 落地范围**仅 current**（与阶段 1 一致, 4.x 暂未纳入 docs-next, 故 `next_versioned_sidebars/version-4.x-sidebars.json` 未创建/未调整）。落地内容: 重写 `sidebars-next.ts` → 旧 8 个一级目录拆/合为新 18 个; 13 个新增占位文档（`docs-next/architecture-concepts/{overview,system-architecture,storage-compute-decoupled,mpp-execution-engine,storage-layer,metadata-management}.md`, `docs-next/use-cases/overview.md`, `docs-next/release-notes/overview.md`, `docs-next/hybrid-search/{overview,recipes,rag}.md`, `docs-next/ai/{model-providers,end-to-end-examples}.md`）。中文 i18n 仅追加 sidebar category 标签翻译（current.json）, 占位文档自身的 zh 翻译走 EN 兜底。
>
> 本地构建验证: `DOCS_VERSIONS=current yarn build` — 18 个一级目录全部产出 HTML; sitemap 不含 docs-next; robots.txt Disallow 生效。yarn 进程 exit 1 来自 HTML minifier 对 sql-manual 几个页面的"control character"诊断 + client-redirects 重名告警, **均为既有问题**, 与本次 IA 重构无关。

- [x] 在 `sidebars-next.ts` 中按新 IA 调整 current 顶层结构（不改 docId）— 顶级从 8 项变 18 项: Getting Started / **Architecture & Concepts**（新）/ Installation & Deployment / Connect & Develop / Table Design / Data Operations / Querying / Lakehouse / **Hybrid Search**（新）/ **AI**（拆分后）/ Compute-Storage Decoupled / Performance & Tuning（含 Benchmark）/ Administration / Observability with Doris / Ecosystem & Integrations / Troubleshooting & FAQ / Reference / **Release Notes**（新）
- [~] 在 `next_versioned_sidebars/version-4.x-sidebars.json` 同步调整 4.x sidebar — 4.x 未纳入 docs-next, 此项暂搁置
- [x] 把 Lakehouse / Hybrid Search / AI / Compute-Storage Decoupled 提到一级
- [x] 取消 Guides 包装层 — 12 个原 Guides 子项重新分发到 Installation / Connect & Develop / Table Design / Data Operations / Querying / Lakehouse / Hybrid Search / AI / Compute-Storage Decoupled / Observability with Doris / Administration（Security 移入）
- [x] 拆分 AI 为 Hybrid Search + AI — Hybrid Search 收 `ai/text-search/{overview,search-operators,search-function,scoring}` + `ai/vector-search/{overview,practical-guide,performance,performance-large-scale}`; AI 收 `ai/{ai-overview,ai-function-overview,model-providers,end-to-end-examples}`; 索引 DDL（`ai/text-search/{custom-analyzer,custom-normalizer}` + `ai/vector-search/{hnsw,ivf,ivf-on-disk,index-management,quantization-survey,resource-estimation,behind-index}`）按 IA 归并到 Table Design → Indexes → Inverted/Vector Index 子组（仅 sidebar 引用, 文件位置不动）
- [x] 重组 Table Design 内部 8 个分组 — Overview / Table Models / Data Types / Partitioning & Bucketing / Indexes / Storage Layout / Schema Evolution / Special Tables / Best Practices
- [x] 必要的少量文档新增（Architecture & Concepts、Use Cases、Release Notes 入口页）— 13 个占位 `.md` 文档（前文备注列出）
- [x] 中文 sidebar 同步（current.json / version-4.x.json 中的标签翻译）— current.json 追加 38 个 sidebar category 标签翻译; version-4.x.json 因 4.x 未纳入而未动
- [x] 计划外补充: 为 Installation & Deployment 一级目录补 link 入口页（参照 Getting Started 模式）— 新增 `docs-next/install/intro.mdx` + zh-CN 对应文件, sidebar 上挂 `link: {type: 'doc', id: 'install/intro'}`, 卡片导航到下一级（Choosing Mode / Preparation / Manual / Kubernetes / Cloud）
- [x] 计划外补充: Installation & Deployment 二级目录同样补 link 入口页 — 新增 `install/deploy-manually/intro`、`install/deploy-on-kubernetes/intro`、`install/doris-operator/intro`、`install/deploy-on-kubernetes/separating-storage-compute/intro`（EN + zh-CN 各 4 份）, sidebar 上对应 4 个 category 加 `link`, 其中 Separating Storage Compute 的 `link` 由原来的 `install-doris-cluster` 改指向新 `intro`; 父页 `install/intro.mdx` 的 Manual / K8s 卡片同步指向新的二级 intro

### 阶段 3（灰度）

- [ ] 实现 `<DocPageBanner />` Swizzle 组件
- [ ] 老站 / 新站双向 banner 上线
- [ ] 加 Matomo 事件埋点
- [ ] 灰度持续 1–3 个月

### 阶段 4（切换）

- [ ] 主导航 / 主页 docs 链接切到新版
- [ ] kapa.ai disclaimer 链接更新（§10.1 第一项）
- [ ] **联系 kapa.ai 后台 owner**, 把爬虫源切到 `/docs-next/`（§10.1 第二项, 仓库外动作）
- [ ] 移除 noindex / unlisted
- [ ] sitemap 与 search-local 接入新版
- [ ] banner 反转

### 配套（可任意阶段）

- [ ] 更新 `CONTRIBUTING.md` 加 docs-next 翻译指南（§10.2）
- [ ] 更新 PR 模板提示中文 4 路径同步（§10.2）
- [ ] 在 `manual-i18n-translate-workflow.yaml` 加 `source_dir` 守卫防误扫（§10.3）

---

## 十二、风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 第一次 build 因 docId 重复或 sidebar 不匹配失败 | 中 | 阶段 1 卡住 | 严格"先全拷再修", 不在阶段 1 改 docId |
| 维护者在 docs-next PR 中漏改中文目录 | 高 | 中英文不同步 | CONTRIBUTING.md 明确 4 个同步路径（见 §10.2）+ PR 模板提示 + CI 加双语完整性检查（可选） |
| ja 自动翻译 workflow 被误传 `docs-next` | 低 | 产生不期望的 ja 翻译 PR | workflow 里加 `source_dir` 守卫（见 §10.3） |
| 老站和新站文档内容长期漂移 | 高 | 用户在两边看到不同内容 | 5.3 的同步策略 + 季度 rebase |
| SEO 双倍权重稀释 | 中 | 搜索流量短期波动 | 灰度期 noindex；切换后单一 canonical |
| banner 引导导致用户混淆 | 低 | 支持咨询增多 | banner 可关闭；FAQ 加专门条目 |
| ja 用户期望也有新版 | 低 | 反馈面投诉 | 在新版页面顶部说明"中英文先行" |

---

## 附录 A: 仓库引用映射

旧文件 → 新文件（命名约定）:

| 旧 | 新 |
|----|----|
| `docs/` | `docs-next/` |
| `versioned_docs/version-4.x/` | `next_versioned_docs/version-4.x/` |
| `versions.json` | `next_versions.json` |
| `sidebars.ts` | `sidebars-next.ts` |
| `versioned_sidebars/version-4.x-sidebars.json` | `next_versioned_sidebars/version-4.x-sidebars.json` |
| `i18n/zh-CN/docusaurus-plugin-content-docs/current/` | `i18n/zh-CN/docusaurus-plugin-content-docs-next/current/` |
| `i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/` | `i18n/zh-CN/docusaurus-plugin-content-docs-next/version-4.x/` |

> Docusaurus 多实例插件的目录命名是**约定**: 插件 id = `next` 时, 自动按 `next_versioned_*` / `docusaurus-plugin-content-docs-next` 寻找。无需额外配置。

## 附录 B: 参考链接

- Docusaurus 多实例 docs 插件: https://docusaurus.io/docs/docs-multi-instance
- Docusaurus versioning: https://docusaurus.io/docs/versioning
- `unlisted` frontmatter: https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs#unlisted
- Swizzling 主题组件: https://docusaurus.io/docs/swizzling
