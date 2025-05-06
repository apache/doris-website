---
{
  "title": "WEEKS_DIFF",
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
用于计算两个日期或时间值之间相差的完整周数（以 7 天为单位）。

## 语法

```sql
WEEKS_DIFF(<end_date>, <start_date>)
```

## 必选参数
| 参数名称         | 数据类型               | 描述          |
|--------------|--------------------|-------------|
| `end_date`   | `DATE`, `DATETIME` | 较晚的日期或者日期时间 |
| `start_date` | `DATE`, `DATETIME` | 较早的日期或者日期时间 |


## 举例

1. `2020-12-25` 与 `2020-10-25` 相差多少周
    ```sql
    select weeks_diff('2020-12-25','2020-10-25');
    ```
    ```text
    +----------------------------------------------------------+
    | weeks_diff('2020-12-25 00:00:00', '2020-10-25 00:00:00') |
    +----------------------------------------------------------+
    |                                                        8 |
    +----------------------------------------------------------+
    ```

2. `2020-12-25 10:10:02` 与 `2020-10-25 12:10:02` 相差多少周
    ```sql
    select weeks_diff('2020-12-25 10:10:02','2020-10-25 12:10:02');
    ```
    ```text
    +--------------------------------------------------------------------------------------------------------+
    | weeks_diff(cast('2020-12-25 10:10:02' as DATETIMEV2(0)), cast('2020-10-25 12:10:02' as DATETIMEV2(0))) |
    +--------------------------------------------------------------------------------------------------------+
    |                                                                                                      8 |
    +--------------------------------------------------------------------------------------------------------+
    ```

3. `2020-12-25 10:10:02` 与 `2020-10-25` 相差多少周
    ```sql
    select weeks_diff('2020-12-25 10:10:02','2020-10-25');
    ```
    ```text
    +----------------------------------------------------------------------------------------+
    | weeks_diff(cast('2020-12-25 10:10:02' as DATETIMEV2(0)), cast('2020-10-25' as DATEV2)) |
    +----------------------------------------------------------------------------------------+
    |                                                                                      8 |
    +----------------------------------------------------------------------------------------+
    ```