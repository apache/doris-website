---
{
    "title": "Text/CSV/JSON",
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

本文档用于介绍 Doris 的文本文件格式的读写支持情况。

## Text/CSV

* Catalog

  支持读取 `org.apache.hadoop.mapred.TextInputFormat` 格式的 Hive 表。

  支持读取 `org.apache.hadoop.hive.serde2.OpenCSVSerde` 格式的 Hive 表。（2.1.7 版本支持）

* Table Valued Function

* 导入

  导入功能支持的 Text/CSV 格式，详见导入相关文档。

* 导出

  导出功能支持的 Text/CSV 格式，详见导出相关文档。

### 支持的压缩格式

* umcomressed

* gzip

* deflate

* bzip2

* zstd

* lz4

* snappy

* lzo

## JSON

* Catalog

  支持读取 `org.apache.hive.hcatalog.data.JsonSerDe` 格式的 Hive 表。（3.0.4 版本支持）

* 导入

  导入功能支持的 JSON 格式，详见导入相关文档。

