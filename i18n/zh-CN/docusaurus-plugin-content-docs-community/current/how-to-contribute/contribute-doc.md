---
{
    "title": "文档贡献指南",
    "language": "zh-CN"
}
---

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

本篇文档贡献指南主要介绍 Doris 的文档如何修改与贡献。**不论是历史版本的文档或最新版本文档，皆在 [apache/doris-website](https://github.com/apache/doris-website) 代码库上提交 PR 修改。**

:::tip

PR 提交指南还可以参考：

- [为 Doris 做贡献](https://doris.apache.org/zh-CN/community/how-to-contribute/)

- [代码提交指南](https://doris.apache.org/zh-CN/community/how-to-contribute/pull-request)
:::


## Doris Website 目录结构

```Plain
.
├── blog
│   ├── 1.1 Release.md
│   ├── Annoucing.md
│   ├── jd.md
│   ├── meituan.md
│   ├── release-note-0.15.0.md
│   ├── release-note-1.0.0.md
│   └── xiaomi.md
├── community
│   ├── design
│   │   ├── spark_load.md
│   │   ├── doris_storage_optimization.md
│   │   ├── grouping_sets_design.md
│   │   └── metadata-design.md
│   ├── ......
├── docs
│   ├── admin-manual
│   │   ├── cluster-management
│   │   ├── config
│   │   ├── data-admin
│   │   ├── http-actions
│   │   ├── maint-monitor
│   │   ├── privilege-ldap
│   │   ├── multi-tenant.md
│   │   ├── optimization.md
│   │   ├── query-profile.md
│   │   └── sql-interception.md
│   │   └── workload-group.md
│   ├── ......
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   ├── version-1.2
│       │   ├── version-2.0
│       │   ├── version-2.1
│       │   ├── current.json
│       │   ├── version-1.2.json
│       │   ├── version-2.0.json
│       │   ├── version-2.1.json
│       ├── docusaurus-plugin-content-docs-community
│       └── local_build_docs.sh
├── src
│   ├── components
│   │   ├── Icons
│   │   ├── More
│   │   ├── PageBanner
│   │   └── PageColumn
│   ├── ......
├── static
│   ├── images
│   │   ├── Bloom_filter.svg.png
│   │   ├── .....
│   └── js
│       └── redirect.js
├── versioned_docs
│   ├── version-1.2
│   │   ├── admin-manual
│   │   ├── advanced
│   │   ├── benchmark
│   │   ├── data-operate
│   │   ├── data-table
│   │   ├── ecosystem
│   │   ├── faq
│   │   ├── get-starting
│   │   ├── install
│   │   ├── lakehouse
│   │   ├── query-acceleration
│   │   ├── releasenotes
│   │   └── sql-manual
│   └── version-2.0
│       ├── admin-manual
│       ├── benchmark
│       ├── data-operate
│       ├── db-connect
│       ├── ecosystem
│       ├── faq
│       ├── get-starting
│       ├── install
│       ├── lakehouse
│       ├── query
│       ├── releasenotes
│       ├── sql-manual
│       └── table-design
└── version-2.1
│       ├── admin-manual
│       ├── advanced
│       ├── benchmark
│       ├── data-operate
│       ├── data-table
│       ├── ecosystem
│       ├── faq
│       ├── get-starting
│       ├── install
│       ├── lakehouse
│       ├── query-acceleration
│       ├── releasenotes
│       └── sql-manual
├── versioned_sidebars
│   ├── version-1.2-sidebars.json
│   └── version-2.0-sidebars.json
│   └── version-2.1-sidebars.json
├── babel.config.js
├── build.sh
├── buildVersions.sh
├── docusaurus.config.js
├── package.json
├── README.md
├── sidebars.json
├── sidebarsCommunity.json
├── tree.out
├── tsconfig.json
├── versions.json
```

下面介绍 Doris Website 站点的各个目录结构，以方便用户找到对应根目录并提交修改文档。

### 01 博客目录

博客目录在根目录 `/blog` 下，所有博客 Markdown 文件放到该目录下。如果您感兴趣参与博客贡献或愿意分享技术心得，欢迎通过 dev@doris.apache.org 或直接提交 Blog PR 参与博客共建

### 02 文档目录

- 当你需要**修改已有文档内容**时，需要**同时更新** Master 分支最新文档版本和相应的各版本（如 2.1、2.0、1.2 或多版本）；

- 当你需要**添加新文档**时，除了上传新的 Markdown 文件之外，还需要在文档目录结构中添加新文档链接路径；

- 当你需要**新增文档目录栏**时，除了对目录结构进行调整，还需要对新增的目录栏进行中文翻译。

以下是需要进行修改的文件列表：

1. **Markdown 文件：** 这是你新增的文档内容，你需要将其上传到相应的文件夹中，并在 Markdown 文件中编写具体的文档内容。

2. **Sidebar 文件：** 这是控制中英文文档的目录结构文件，你需要在其中添加新文档路径链接，以便在目录中正确显示新文档的位置。当前 Master 最新文档分支与各版本文档皆由不同的 Sidebar 文件控制，包括 `sidebar.json` / `version-2.0-sidebars.json` / `version-2.1-sidebars.json`

3. **目录栏中文翻译文件：** 这是在新增文档目录栏后，控制目录栏在中文文档中的翻译文件。你需要按照正确的格式进行编辑，以确保目录栏名称正确显示。与 Sidebar 文件相同，当前 Master 最新文档分支与各版本文档由不同翻译文件控制，包括`current.json / version-1.2.json / version-2.0.json /version-2.1.json`


:::caution 注意

所有文档必须同时含有中文与英文文档，否则会造成目录结构不一致、中文文档无法显示等问题。这个适用于所有博客、文档、社区内容。
:::


下面将介绍各版本文档如何进行内容修改、文档目录结构修改、目录栏中文翻译的操作。

**Dev 版本：为 Doris 最新 Master 分支文档。**

**1. 内容修改**

该版本的英文文档在根目录 `docs` 下进行修改

```Plain
.
├── docs
│   ├── admin-manual
│   ├── ......
```

中文文档在根目录 `i18n / zh-CN / docusaurus-plugin-content-docs / current`下进行修改

```Plain
.
├── docs
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   │    ├── admin-manual
│       │   │    ├── ......
```

**2. 文档目录结构**

Dev 版本中英文文档统一由根目录下 `sidebar.json`进行控制。

```Plain
.
├── docs
│   ├── admin-manua
│   ├── ......
├── i18n
├── src
├── static
├── versioned_docs
├── versioned_sidebars
├── sidebars.json
```

`sidebar.json` 示例如下：

```JSON
{
    "docs": [
            {
                "type": "category",
                "label": "Getting Started",
                "items": [
                    "get-starting/quick-start",
                    "get-starting/what-is-apache-doris"
                ]
            },
            {
                "type": "category",
                "label": "Install and Deploy",
                "items": [
                    "install/standard-deployment",
                    {
                        "type": "category",
                        "label": "Docker Deployment",
                        "items": [
                            "install/construct-docker/build-docker-image",
                            "install/construct-docker/run-docker-cluster"
                        ]
             }
             ......
         }
     ]
 }
```

**3. 文档目录栏中文翻译**

Dev 版本的目录栏中文翻译文件在根目录`i18n / zh-CN / docusaurus-plugin-content-docs / current.json `中。

以文档目录“快速开始”为例：

- 这里的 `sidebar.docs.category.Getting Started` 与目录下的 `sidebars.json` 里的 `label`层级对应
- 编写格式为：sidebar + "." + docs + "." + [type] + [label]

```JSON
{
      "version.label": {
        "message": "dev",
        "description": "The label for version current"
      },
      "sidebar.docs.category.Getting Started": {
        "message": "快速开始",
        "description": "The label for category Getting Started in sidebar docs"
      },
      ......
  }
{
    "docs": [
            {
                "type": "category",
                "label": "Getting Started",
                "items": [
                    "get-starting/quick-start",
                    "get-starting/what-is-apache-doris"
                ]
            },
            ......
         }
     ]
 }
```

**2.1 / 2.0 /1.2 版本**

**1. 内容修改**

- 2.1 版本的英文文档在根目录 `/versioned_docs/version-2.1` 下，中文文档在根目录 `i18n / zh-CN / docusaurus-plugin-content-docs / version-2.1`下

- 2.0 版本的英文文档在根目录 `/versioned_docs / version-2.0` 下，中文文档在根目录 `i18n / zh-CN / docusaurus-plugin-content-docs / version-2.0 ` 下

- 1.2 版本的英文文档在根目录 `/versioned_docs / version-1.2` 下，中文文档在根目录 `i18n / zh-CN / docusaurus-plugin-content-docs / version-1.2`下

```Plain
.
├── blog
├── community
├── docs
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── current
│       │   ├── version-1.2
│       │   ├── version-2.0
│       │   ├── version-2.1
├── versioned_docs
│   ├── version-1.2
│   ├── version-2.0
│   ├── version-2.1
```

**1. 文档目录结构**

各版本中英文文档统一由根目录下的 `version-X.X-sidebars.json`进行控制。

```Plain
.
├── blog
├── community
├── docs
├── i18n
├── versioned_docs
├── versioned_sidebars
│   ├── version-1.2-sidebars.json
│   └── version-2.0-sidebars.json
│   └── version-2.1-sidebars.json
```

各版本 Sidebar 层级修改与上文 Dev 版本修改基本一致，在此不进行举例说明。

**2. 目录栏中文翻译**

各版本目录栏的中文翻译文件统一在根目录`i18n / zh-CN / docusaurus-plugin-content-docs / version-X.X.json `中。

```Plain
├── i18n
│   └── zh-CN
│       ├── docusaurus-plugin-content-docs
│       │   ├── version-1.2.json
│       │   ├── version-2.0.json
│       │   ├── version-2.1.json
```

各版本中文文档 `label` 翻译与上文 Dev 版本修改基本一致，在此不进行举例说明

### 03 社区文档目录

社区文档当前为通用版，不区分版本。

1. 英文文档在根目录下的 `community/` 目录下面。

2. 中文文档在  `i18n/zh-CN/docusaurus-plugin-content-docs-community/` 目录下面。

3. 社区文档的目录结构在根目录下的 `sidebarsCommunity.json` 文件中

4. 社区文档的目录栏中文翻译文件在 `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json`中

```JSON
        {
       "version.label": {
         "message": "Next",
         "description": "The label for version current"
       },
       "sidebar.community.category.How to Contribute": {
         "message": "贡献指南",
         "description": "The label for category How to Contribute in sidebar community"
       },
       "sidebar.community.category.Release Process & Verification": {
         "message": "版本发布与校验",
         "description": "The label for category Release Process & Verification in sidebar community"
       },
       "sidebar.community.category.Design Documents": {
         "message": "设计文档",
         "description": "The label for category Design Documents in sidebar community"
       },
       "sidebar.community.category.Developer Guide": {
         "message": "开发者手册",
         "description": "The label for category Developer Guide in sidebar community"
       }
     }
```

### 04 图片目录

1. 所有图片都在 `static/images `目录下

2. 图片引用路径格式为 `![文本描述](/images/图片名称.图片格式)`
   
   - 文本描述：根据图片内容自定义，建议文本描述就近引用该图片所在的标题内容
   
   - 图片名称：文件名由多个英文单词组成时，单词中间**由短划线“-”隔开**

## **如何编写命令帮助手册**

命令帮助手册文档，是指在 Master 分支与各版本文档 `/sql-manual` 下的文档。这些文档主要用于两个地方：

1. 官网文档展示。

2. HELP 命令的输出。

为了支持 HELP 命令输出，文档需要严格按照以下格式排版编写，否则无法通过准入检查。

以 `SHOW ALTER` 命令示例如下：

```markdown
---
{
    "title": "SHOW-ALTER",
    "language": "zh-CN"
}
---

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

## SHOW-ALTER

### Name

SHOW ALTER

### Description

（描述命令语法。）

### Example

（提供命令示例。）

### Keywords

SHOW, ALTER

### Best Practice

（最佳实践（如有））
```

:::caution 注意
不论中文还是英文文档，以上标题都需使用英文，并且注意标题的层级。
:::

