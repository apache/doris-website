---
{
    "title": "PLAN REPLAYER PLAY",
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


## 描述

PLAN REPLAYER PLAY 是 Doris 开发者用来分析优化器问题的工具。其根据[PLAN REPLAYER DUMP](https://selectdb.feishu.cn/wiki/VFEhwnJ9Bi0Si4kIebEcyzMXnNh?preview_comment_id=7434512678431211524)生成的诊断文件，在对应版本的 fe 下可以加载元数据和统计信息用于开发者复现和调试问题。

## 语法

```sql
PLAN REPLAYER PLAY <absolute-directory-of-dumpfile>；
```

## 必选参数

`<absolute-directory-of-dumpfile>`

- 指定对应 dump 文件的绝对路径的字符串。
- 标识符必须以双引号围起来，而且是对应文件的绝对路径。

## 示例

当我们有一个 dumpfile: /home/wangwu/dumpfile.json 时，可以使用下面 sql 来复现场景

```sql
PLAN REPLAYER PLAY "/home/wangwu/dumpfile.json"；
```