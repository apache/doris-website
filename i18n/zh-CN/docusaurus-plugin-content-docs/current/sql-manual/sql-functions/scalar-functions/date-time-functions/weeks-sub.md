---
{
    "title": "WEEKS_SUB",
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
用于在指定的日期或时间值上减少一定数量的周（即减去 weeks * 7 天）。

## 语法
```sql
WEEKS_SUB(<date_value>, <week_period>)
```

## 必选参数
| 参数名称          | 描述                                                                |
|---------------|-------------------------------------------------------------------|
| `date_value`  | `DATE` 或 `DATETIME` 类型的输入值。                                       |
| `week_period` | 整数，表示要减少的周数（正数表示减少，负数表示增加）。                                       |

  
## 举例

1. 在 `2020-02-02 02:02:02` 日期时间上减去一周
    ```sql
    select weeks_sub("2020-02-02 02:02:02", 1);
    ```
    ```text
    +-------------------------------------+
    | weeks_sub('2020-02-02 02:02:02', 1) |
    +-------------------------------------+
    | 2020-01-26 02:02:02                 |
    +-------------------------------------+
    ```

2. 在 `2020-02-02` 日期上减去一周
    ```sql
    select weeks_sub("2020-02-02", 1);
    ```
    ```text
    +--------------------------------------------+
    | weeks_sub(cast('2020-02-02' as DATEV2), 1) |
    +--------------------------------------------+
    | 2020-01-26                                 |
    +--------------------------------------------+
    ```
