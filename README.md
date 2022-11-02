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

# Doris document website

This repo is for [Apache Doris Website](https://doris.apache.org)

And it use Github Action to automatically sync content from [Apache Doris Code Repo](https://github.com/apache/doris)

There are 2 Github Actions:

1. cron-deploy-website.yml

   It will sync at 01:00 AM everyday from Doris's master branch.

2. manual-deploy-website.yml

   It can only be triggered manually, and you can specify the branch name you want to sync.

## View the website

To view the website, navigate to 
[https://doris.apache.org](https://doris.apache.org)

## Run & Build Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Modify the document

### Use `<version>` to mark the document version

How to use: [Doris 文档版本标记用法](https://selectdb.feishu.cn/docx/TdmDdhNTDoAKGbx1mkbcT3sbn8P)


### website directory structure

````
.
├── README.md
├── babel.config.js
├── blog
│ ├── 1.1 Release.md
│ ├── Annoucing.md
│ ├── jd.md
│ ├── meituan.md
│ ├── release-note-0.15.0.md
│ ├── release-note-1.0.0.md
│ └── xiaomi.md
├── build.sh
├── community
│ ├── design
│ │ ├── Flink-doris-connector-Design.md
│ │ ├── doris_storage_optimization.md
│ │ ├── grouping_sets_design.md
│ │ └── metadata-design.md
│ ├──  
├── docs
│ ├── admin-manual
│ │ ├── cluster-management
│ │ ├── config
│ │ ├── data-admin
│ │ ├── http-actions
│ │ ├── maint-monitor
│ │ ├── multi-tenant.md
│ │ ├── optimization.md
│ │ ├── privilege-ldap
│ │ ├── query-profile.md
│ │ └── sql-interception.md
│ ├──  
├── docusaurus.config.js
├── i18n
│ └── en-US
│ ├── code.json
│ ├── docusaurus-plugin-content-blog
│ ├── docusaurus-plugin-content-docs
│ ├── docusaurus-plugin-content-docs-community
│ └── docusaurus-theme-classic
├── package.json
├── sidebars.json
├── sidebarsCommunity.json
├── src
│ ├── components
│ │ ├── Icons
│ │ ├── More
│ │ ├── PageBanner
│ │ └── PageColumn
│ ├──  
├── static
│ ├── images
│ │ ├── Bloom_filter.svg.png
│ │ ├── .....
│ └── js
│ └── redirect.js
├── tree.out
├── tsconfig.json
├── versioned_docs
│ ├── version-0.15
│ │ ├── administrator-guide
│ │ ├── best-practices
│ │ ├── extending-doris
│ │ ├── getting-started
│ │ ├── installing
│ │ ├── internal
│ │ ├── sql-reference
│ │ └── sql-reference-v2
│ └── version-1.0
│ ├── administrator-guide
│ ├── benchmark
│ ├── extending-doris
│ ├── faq
│ ├── getting-started
│ ├── installing
│ ├── internal
│ ├── sql-reference
│ └── sql-reference-v2
├── versioned_sidebars
│ ├── version-0.15-sidebars.json
│ └── version-1.0-sidebars.json
├── versions.json

````

Directory structure description:

1. Blog Directory

   - The English blog directory is under the blog in the root directory, and the English files of all blogs are placed in this directory
   - The directory of the Chinese blog is in the `i18n/zh-CN/docusaurus-plugin-content-blog` directory, all Chinese blog files are placed under this
   - The file names of Chinese and English blogs should be the same

2. Document Content Directory

   - The latest version of the English document content is under docs in the root directory

   - The version of the English documentation is under `versioned_docs/` in the root directory

     - This directory only holds documents from historical versions

       ````
       .
       ├── version-0.15
       │ ├── administrator-guide
       │ ├── best-practices
       │ ├── extending-doris
       │ ├── getting-started
       │ ├── installing
       │ ├── internal
       │ ├── sql-reference
       │ └── sql-reference-v2
       └── version-1.0
           ├── administrator-guide
           ├── benchmark
           ├── extending-doris
           ├── faq
           ├── getting-started
           ├── installing
           ├── internal
           ├── sql-reference
           └── sql-reference-v2
       ````

     - Versioning of English documents is under `versioned_sidebars` in the root directory

       ````
       .
       ├── version-0.15-sidebars.json
       └── version-1.0-sidebars.json
       ````

       The json file here is written according to the directory structure of the corresponding version
   
   - Chinese documentation at `i18n/zh-CN/docusaurus-plugin-content-docs`
   
        - Below this corresponds to different version directories and json files corresponding to the version, as follows
   
          current is the current latest version of the document. The example corresponds to version 1.1. When modifying, according to the document version to be modified, find the corresponding file modification in the corresponding directory and submit it.
   
          ````
          .
          ├── current
          │ ├── admin-manual
          │ ├── advanced
          │ ├── benchmark
          │ ├── data-operate
          │ ├── data-table
          │ ├── ecosystem
          │ ├── faq
          │ ├── get-starting
          │ ├── install
          │ ├── sql-manual
          │ └── summary
          ├── current.json
          ├── version-0.15
          │ ├── administrator-guide
          │ ├── best-practices
          │ ├── extending-doris
          │ ├── getting-started
          │ ├── installing
          │ ├── internal
          │ ├── sql-reference
          │ └── sql-reference-v2
          ├── version-0.15.json
          ├── version-1.0
          │ ├── administrator-guide
          │ ├── benchmark
          │ ├── extending-doris
          │ ├── faq
          │ ├── getting-started
          │ ├── installing
          │ ├── internal
          │ ├── sql-reference
          │ └── sql-reference-v2
          └── version-1.0.json
          ````
   
        - Version Json file
   
          Current.json corresponds to the Chinese translation of the latest version of the document, for example:
   
          ````json
          {
            "version.label": {
              "message": "1.1",
              "description": "The label for version current"
            },
            "sidebar.docs.category.Getting Started": {
              "message": "Quick Start",
              "description": "The label for category Getting Started in sidebar docs"
            }
            .....
          }
          ````
   
          Here `sidebar.docs.category.Getting Started` corresponds to `label` in `sidebars.json` in the root directory
   
          For example, the `sidebar.docs.category.Getting Started` just now corresponds to the `sidebar` prefix and the structure in `sidebars.json`
   
          The first is `sidebar + "." + docs + ".'" + [ type ] + [ label ] `.
   
          ````json
          {
              "docs": [
                  {
                      "type": "category",
                      "label": "Getting Started",
                      "items": [
                          "get-starting/get-starting"
                      ]
                  },
                  {
                      "type": "category",
                      "label": "Doris Introduction",
                      "items": [
                          "summary/basic-summary"
                      ]
                  }
                .....
          }
          ````
   
        - Support label translation in the Chinese version json file, no need to describe the document hierarchy, which is described in the `sidebar.json` file
   
        - All documents must be in English, and Chinese can only be displayed. If English is not written, you can create an empty file, otherwise Chinese documents will not be displayed. This applies to all blogs, documents, and community content
   

2. Community Documentation

   This document does not distinguish between versions and is generic

   - English documentation is under the `community/` directory in the root directory.

   - Chinese documentation is under `i18n/zh-CN/docusaurus-plugin-content-docs-community/` directory.

   - The directory structure of community documents is controlled in the `sidebarsCommunity.json` file in the root directory,

   - The Chinese translation corresponding to the community documentation directory structure is in the `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` file

     ````json
     {
       "version.label": {
         "message": "Next",
         "description": "The label for version current"
       },
       "sidebar.community.category.How to Contribute": {
         "message": "Contribution Guidelines",
         "description": "The label for category How to Contribute in sidebar community"
       },
       "sidebar.community.category.Release Process & Verification": {
         "message": "Version release and verification",
         "description": "The label for category Release Process & Verification in sidebar community"
       },
       "sidebar.community.category.Design Documents": {
         "message": "Design document",
         "description": "The label for category Design Documents in sidebar community"
       },
       "sidebar.community.category.Developer Guide": {
         "message": "Developer's Manual",
         "description": "The label for category Developer Guide in sidebar community"
       }
     }
     ````

3. Pictures

   All images are in the `static/images` directory



## 修改文档（中文版）

### website目录结构

```
.
├── README.md
├── babel.config.js
├── blog
│   ├── 1.1 Release.md
│   ├── Annoucing.md
│   ├── jd.md
│   ├── meituan.md
│   ├── release-note-0.15.0.md
│   ├── release-note-1.0.0.md
│   └── xiaomi.md
├── build.sh
├── community
│   ├── design
│   │   ├── Flink-doris-connector-Design.md
│   │   ├── doris_storage_optimization.md
│   │   ├── grouping_sets_design.md
│   │   └── metadata-design.md
│   ├── ......
├── docs
│   ├── admin-manual
│   │   ├── cluster-management
│   │   ├── config
│   │   ├── data-admin
│   │   ├── http-actions
│   │   ├── maint-monitor
│   │   ├── multi-tenant.md
│   │   ├── optimization.md
│   │   ├── privilege-ldap
│   │   ├── query-profile.md
│   │   └── sql-interception.md
│   ├── ......
├── docusaurus.config.js
├── i18n
│   └── zh-CN
│       ├── code.json
│       ├── docusaurus-plugin-content-blog
│       ├── docusaurus-plugin-content-docs
│       ├── docusaurus-plugin-content-docs-community
│       └── docusaurus-theme-classic
├── package.json
├── sidebars.json
├── sidebarsCommunity.json
├── src
│   ├── components
│   │   ├── Icons
│   │   ├── More
│   │   ├── PageBanner
│   │   └── PageColumn
│   ├── ......
├── static
│   ├── images
│   │   ├── Bloom_filter.svg.png
│   │   ├── .....
│   └── js
│       └── redirect.js
├── tree.out
├── tsconfig.json
├── versioned_docs
│   ├── version-0.15
│   │   ├── administrator-guide
│   │   ├── best-practices
│   │   ├── extending-doris
│   │   ├── getting-started
│   │   ├── installing
│   │   ├── internal
│   │   ├── sql-reference
│   │   └── sql-reference-v2
│   └── version-1.0
│       ├── administrator-guide
│       ├── benchmark
│       ├── extending-doris
│       ├── faq
│       ├── getting-started
│       ├── installing
│       ├── internal
│       ├── sql-reference
│       └── sql-reference-v2
├── versioned_sidebars
│   ├── version-0.15-sidebars.json
│   └── version-1.0-sidebars.json
├── versions.json

```

目录结构说明：

1. 博客目录

   - 英文博客目录在根目录下的blog下面，所有博客的英文文件放到这个目录下
   - 中文博客的目录在 `i18n/zh-CN/docusaurus-plugin-content-blog` 目录下，所有中文博客文件放到这个下面
   - 中英文博客的文件名称要一致

2. 文档内容目录

   - 最新版本的英文文档内容在根目录下的docs下面

   - 英文文档的版本在根目录下的 `versioned_docs/` 下面

     - 这个目录只放历史版本的文档

       ```
       .
       ├── version-0.15
       │   ├── administrator-guide
       │   ├── best-practices
       │   ├── extending-doris
       │   ├── getting-started
       │   ├── installing
       │   ├── internal
       │   ├── sql-reference
       │   └── sql-reference-v2
       └── version-1.0
           ├── administrator-guide
           ├── benchmark
           ├── extending-doris
           ├── faq
           ├── getting-started
           ├── installing
           ├── internal
           ├── sql-reference
           └── sql-reference-v2
       ```

     - 英文文档的版本控制在根目录下的 `versioned_sidebars` 下面

       ```
       .
       ├── version-0.15-sidebars.json
       └── version-1.0-sidebars.json
       ```

       这里的 json 文件按照对应版本的目录结构进行编写

   - 中文文档在 `i18n/zh-CN/docusaurus-plugin-content-docs`

     - 在这个下面对应不同的版本目录及版本对应的 json 文件 ，如下效果

       current是当前最新版本的文档，示例中对应的是 1.1 版本，修改的时候，根据要修改的文档版本，在对应目录下找到相应的文件修改，提交即可。

       ```
       .
       ├── current
       │   ├── admin-manual
       │   ├── advanced
       │   ├── benchmark
       │   ├── data-operate
       │   ├── data-table
       │   ├── ecosystem
       │   ├── faq
       │   ├── get-starting
       │   ├── install
       │   ├── sql-manual
       │   └── summary
       ├── current.json
       ├── version-0.15
       │   ├── administrator-guide
       │   ├── best-practices
       │   ├── extending-doris
       │   ├── getting-started
       │   ├── installing
       │   ├── internal
       │   ├── sql-reference
       │   └── sql-reference-v2
       ├── version-0.15.json
       ├── version-1.0
       │   ├── administrator-guide
       │   ├── benchmark
       │   ├── extending-doris
       │   ├── faq
       │   ├── getting-started
       │   ├── installing
       │   ├── internal
       │   ├── sql-reference
       │   └── sql-reference-v2
       └── version-1.0.json
       ```

     - Version Json 文件

       Current.json 对应的是最新版本文档的中文翻译内容，例如：

       ```
       {
         "version.label": {
           "message": "1.1",
           "description": "The label for version current"
         },
         "sidebar.docs.category.Getting Started": {
           "message": "快速开始",
           "description": "The label for category Getting Started in sidebar docs"
         }
         .....
       }
       ```

       这里的 `sidebar.docs.category.Getting Started` 和根目录下的 `sidebars.json`  里的 `label` 对应

       例如刚才这个 `sidebar.docs.category.Getting Started` ，是由 `sidebar` 前缀和 `sidebars.json` 里面的结构对应的

       首先是 `sidebar + "." + docs +  ".'" + [ type ] + [ label ] ` 组成.

       ```json
       {
           "docs": [
               {
                   "type": "category",
                   "label": "Getting Started",
                   "items": [
                       "get-starting/get-starting"
                   ]
               },
               {
                   "type": "category",
                   "label": "Doris Introduction",
                   "items": [
                       "summary/basic-summary"
                   ]
               }
             .....
       }
       ```

     - 在中文的 version json 文件中支持 label 的翻译，不需要描述文档层级关系，文档层级关系是在 `sidebar.json` 文件里描述的

     - 所有的文档必须有英文的，中文才能显示，如果英文没写，可以创建一个空文件，不然中文文档也显示不出来，这个适用于所有博客、文档、社区内容

3. 社区文档

   这块的文档不区分版本，是通用的

   - 英文文档在根目录下的 `community/` 目录下面。

   - 中文文档在  `i18n/zh-CN/docusaurus-plugin-content-docs-community/` 目录下面。

   - 社区文档的目录结构控制在根目录下的 `sidebarsCommunity.json` 文件中，

   - 社区文档目录结构对应的中文翻译在 `i18n/zh-CN/docusaurus-plugin-content-docs-community/current.json` 文件中

     ```json
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

4. 图片

   所有图片都在 `static/images `目录下面
