---
{
   "title": "SWITCH CATALOG",
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

该语句用于切换数据目录（catalog）。

## 语法

```sql
SWITCH <catalog_name>
```

## 必选参数

**1. `<catalog_name>`**
> 要切换的数据目录名称。

## 权限控制

| 权限        | 对象   | 说明                                  |
|-----------|------|-------------------------------------|
| SELECT_PRIV | 数据目录 | 需要对要切换的数据目录（catalog）有 SELECT_PRIV 权限。 |


## 示例

1. 切换到数据目录 hive

   ```sql
  	SWITCH hive;
  	```

