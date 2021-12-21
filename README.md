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

This repo is for [Apache Doris(Incubating) website](https://doris.apache.org)

And it use Github Action to automatically sync content from [Apache Doris(Incubating) Code Repo](https://github.com/apache/incubator-doris)

There are 2 Github Actions:

1. cron-deploy-website.yml

    It will sync at 01:00 AM everyday from Doris's master branch.

2. manual-deploy-website.yml

    It can only be triggered manually, and you can specify the branch name you want to sync.

## View the website

To view the website, navigate to 
[https://doris.apache.org](https://doris.apache.org) 
or
[https://doris.incubator.apache.org](https://doris.incubator.apache.org)

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
| language | en/zn-CN | language |
| layout | Article | Layout of the components |
| sidebar | false | Hide the sidebar |
| isArticle | true | Whether it is an article, do not modify by default |

>**Attention**
>
>The title, description, date, author, and metaTitle field values are filled in by the blog writer, and the other fields are fixed values.
>
>language: en, zh-CN

File header example：

```json
---
{
    "title": "This is title",
    "description": "This is description",
    "date": "2021-11-03",
    "author": "Alex",
    "metaTitle": "article",
    "language": "zh-CN",
    "layout": "Article",
    "sidebar": false
    "isArticle":true
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

## About Doris

For more details about Doris, refer to [incubator-doris](https://github.com/apache/incubator-doris/blob/master/docs/README.md).


