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

### Catalog

- `org.apache.hive.hcatalog.data.JsonSerDe` 格式的 Hive 表（自3.0.4 版本支持）

  1. 支持普通类型和复杂类型。
  2. 不支持 `timestamp.formats` SERDEPROPERTIES

- `org.openx.data.jsonserde.JsonSerDe` 格式的 Hive 表（自3.0.6 版本支持）
  
  1. 支持普通类型和复杂类型。
  2. SERDEPROPERTIES: 只支持 `ignore.malformed.json` 且行为与该JsonSerDe一致, 其他 SERDEPROPERTIES 不生效。 
  3. 不支持`Using Arrays`(类似于Text/CSV, 将所有列的数据放一个数组中)。
  4. 不支持Promoting a Scalar to an Array (提升标量返回一个的单元素数组)。
  5. 可以通过`set read_hive_json_in_one_column = true`, 将一整行json数据都放到第一列中，要求第一列的数据类型为String.

### 导入

导入功能支持的 JSON 格式，详见导入相关文档。

## 字符集

Doris 目前仅支持 UTF-8 编码的字符集。而某些数据，如 Hive Text 格式表中的数据会包含非 UFT-8 编码的内容，会导致读取失败，并报错：

```text
Only support csv data in utf8 codec
```

此时，可以通过设置会话变量：

```sql
SET enable_text_validate_utf8 = false
```

来忽略 UFT-8 编码检查，以便能够读取这些内容。注意，这个参数仅用于忽略检查，非 UTF-8 编码的内容仍会显示为乱码。

此参数自 3.0.4 版本支持。
