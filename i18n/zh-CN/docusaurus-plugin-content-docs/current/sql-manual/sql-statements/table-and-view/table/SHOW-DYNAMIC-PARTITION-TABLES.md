---
{
    "title": "SHOW DYNAMIC PARTITION TABLES",
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

该语句用于展示当前 db 下所有的动态分区表状态

语法：

```sql
SHOW DYNAMIC PARTITION TABLES [FROM db_name];
```

## 示例

 1. 展示数据库 database 的所有动态分区表状态
    
     ```sql
     SHOW DYNAMIC PARTITION TABLES FROM database;
     ```

## 关键词

SHOW, DYNAMIC, PARTITION



