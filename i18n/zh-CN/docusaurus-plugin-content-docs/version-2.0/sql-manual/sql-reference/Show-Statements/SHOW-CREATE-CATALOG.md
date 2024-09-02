---
{
    "title": "SHOW-CREATE-CATALOG",
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

## SHOW-CREATE-CATALOG

### Name


:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

SHOW CREATE CATALOG



### Description

该语句查看 doris 数据目录的创建语句。

语法：

```sql
SHOW CREATE CATALOG catalog_name;
```

说明：

- `catalog_name`: 为 doris 中存在的数据目录的名称。

### Example

1. 查看 doris 中 hive 数据目录的创建语句

   ```sql
   SHOW CREATE CATALOG hive;
   ```

### Keywords

    SHOW, CREATE, CATALOG

### Best Practice

