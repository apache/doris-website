---
{
    "title": "WEEKS_ADD",
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
函数用于在指定的日期或时间值上增加（或减少）一定数量的周

## 语法
```sql
WEEKS_ADD(<datetime_or_date_value>, <weeks_value>)
```

## 必选参数
| 参数                         | 描述                            |
|----------------------------|-------------------------------|
| `<datetime_or_date_value>` | `DATETIME` 或者 `DATE` 类型的输入值   |
| `<weeks_value>`            | 整数，表示要增加或减少的周数（正数表示增加，负数表示减少） |


## 举例

1. 在 `2020-02-02 02:02:02` 时间上增加一周
    ```sql
    select weeks_add("2020-02-02 02:02:02", 1);
    ```
    ```text
      +-------------------------------------+
      | weeks_add('2020-02-02 02:02:02', 1) |
      +-------------------------------------+
      | 2020-02-09 02:02:02                 |
      +-------------------------------------+
    ```

2. 在 `2020-02-02 02:02:02` 时间上减少一周
    ```sql
    select weeks_add("2020-02-02 02:02:02", -1);
    ```
    ```text
    +-------------------------------------------------------------+
    | weeks_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), -1) |
    +-------------------------------------------------------------+
    | 2020-01-26 02:02:02                                         |
    +-------------------------------------------------------------+
    ```

3.  给 `2020-02-02` 日期增加一周
    ```sql
    select weeks_add("2020-02-02", 1);
    ```
    ```text
    +--------------------------------------------+
    | weeks_add(cast('2020-02-02' as DATEV2), 1) |
    +--------------------------------------------+
    | 2020-02-09                                 |
    +--------------------------------------------+
    ```


