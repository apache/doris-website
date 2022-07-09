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
or
[https://doris.apache.org](https://doris.apache.org)

## How to share a blog

The Doris community welcomes the sharing of Doris-related articles. Once merged, these articles will appear on the official Doris website.

Articles include, but are not limited to.

* Doris usage tips
* Introduction to Doris features
* Doris system tuning
* How Doris works
* Doris business scenarios in practice

### Write a blog

TL;DR, you can refer to `blogs/en/datax-doris-writer.md`, and all images should be placed in `blogs/images/blogs/datax-doris-writer/`(One dir per article)

To write a blog file, you must first include following information in the header，It mainly contains the following contents：

| Variable | default | description |
|--------|----------------------------|----------|
| title| - | Blog title|
| description | - | Blog description|
| date | - | Blog date |
| author | - | Blog author |
| metaTitle | - | The title displayed by the browser when browsing the article |
| language | en/zh-CN | language |
| categories | DorisInternals/DorisWeekly/PracticalCases/ReleaseNote | Just required in en language |
| zhCategories | DorisInternals/DorisWeekly/PracticalCases/ReleaseNote | Just required in zh-CN language |

>**Attention**
>
>The title, description, date, author, and metaTitle field values are filled in by the blog writer, and the other fields are fixed values.
>
>language: en, zh-CN
>
>There are four categories of blogs: DorisInternals,DorisWeekly,PracticalCases,ReleaseNote. 

Blog file header example of en language：

```json
---
{
    "title": "This is title",
    "description": "This is description",
    "date": "2021-11-03",
    "author": "Alex",
    "metaTitle": "article",
    "language": "en",
    "categories": "DorisInternals"
}
---
```

Blog file header example of zh-CN language：

```json
---
{
    "title": "This is title",
    "description": "This is description",
    "date": "2021-11-03",
    "author": "Alex",
    "metaTitle": "article",
    "language": "zh-CN",
    "zhCategories": "DorisInternals"
}
---
```

At the same time add Apache License content after the file header：

```
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
```

Finally, write the content of the blog body.

### Blog file directory

After the blog file is written, put it in the corresponding directory. The Chinese language directory is: `blogs/zh-CN/`，The directory corresponding to the English language is：`blogs/en/`.

All images in the blog should be placed in certain directory. For example, your blog file named: `doris-article1.md`, and you need to create a directory `blogs/images/blogs/datax-article1/`, and put all images in this directory.

## How to create a version of the document
The document consists of two parts: markdown file and sidebar js file. The following uses version 1.0 as an example:

First of all, create a directory named 1.0, and then create an en/ directory and a zh-CN/ directory in 1.0 directory. Finally，put the English and Chinese Markdown files into the en/ and zh-CN/ directory.
```
|   |—— 1.0
|   |—— en
|   |   |—— admin-manual 
│   │   |—— advanced
        ...
|   |—— zh-CN
|   |   |—— admin-manual 
│   │   |—— advanced   
        ...
```

Put the 1.0 version sidebar js files into the sidebar/en/ and sidebar/zh-CN/.
```
|   |—— sidebar
|   |—— en
|   |   |—— 1.0.js
        ...
|   |—— zh-CN
|   |   |—— 1.0.js
        ...
```

## About Doris

For more details about Doris, refer to [doris](https://github.com/apache/doris/blob/master/docs/README.md).


