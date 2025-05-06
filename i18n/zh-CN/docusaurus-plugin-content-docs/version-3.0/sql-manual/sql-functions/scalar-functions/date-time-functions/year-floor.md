---
{
    "title": "YEAR_FLOOR",
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
用于将给定的日期向下取整到指定的年份间隔起点。它支持多个变体，可按不同方式 指定起始时间 (origin) 和周期 (period) 进行取整。

## 语法
```sql
YEAR_FLOOR(<date_value>, [<period> | <origin_date_value>])
YEAR_FLOOR(<date_value>, <period>, <origin_date_value>)
```

## 参数
| **参数**                 | **类型**             | **说明**                                                                 |
|----------------------|--------------------|--------------------------------------------------------------------|
| `<date_value>`      | `DATE`, `DATETIME` | 需要取整的 `DATE` 或 `DATETIME` 输入值。                           |
| `<origin_date_value>` | `DATE`, `DATETIME` | 用作基准的 `DATE` 或 `DATETIME` 输入值，如果不填，默认值为 `0001-01-01T00:00:00`。 |
| `<period>`          | `INT`              | 取整的时间间隔，正整数，表示以多少年为周期进行取整。               |


## 举例
1. 按整年取整
    ```sql
    SELECT YEAR_FLOOR('2023-07-13 22:28:18');
    ```
    ```
    +----------------------------------------------------------+
    | year_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0))) |
    +----------------------------------------------------------+
    | 2023-01-01 00:00:00                                      |
    +----------------------------------------------------------+
   ```
   ```sql
    SELECT YEAR_FLOOR('2023-07-13');
    ```
    ```
    +-------------------------------------------------+
    | year_floor(cast('2023-07-13' as DATETIMEV2(0))) |
    +-------------------------------------------------+
    | 2023-01-01 00:00:00                             |
    +-------------------------------------------------+
   ```

2. 以 origin 为基准取整
   ```sql
    SELECT YEAR_FLOOR('2023-07-13 22:28:18', '2020-03-15');
    ```
    ```
    +-----------------------------------------------------------------------------------------------+
    | year_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), cast('2020-03-15' as DATETIMEV2(0))) |
    +-----------------------------------------------------------------------------------------------+
    | 2023-03-15 00:00:00                                                                           |
    +-----------------------------------------------------------------------------------------------+
   ```

3. 以 period 为单位取整
   ```sql
    SELECT YEAR_FLOOR('2023-07-13', 5);
    ```
    ```
   +----------------------------------------------------+
    | year_floor(cast('2023-07-13' as DATETIMEV2(0)), 5) |
    +----------------------------------------------------+
    | 2020-01-01 00:00:00                                |
    +----------------------------------------------------+
   ```

4. 以 origin 和 period 取整
    ```sql
    SELECT YEAR_FLOOR('2023-07-13 22:28:18', 5, '2018-06-01');
    ```
    ```
    +--------------------------------------------------------------------------------------------------+
    | year_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5, cast('2018-06-01' as DATETIMEV2(0))) |
    +--------------------------------------------------------------------------------------------------+
    | 2023-06-01 00:00:00                                                                              |
    +--------------------------------------------------------------------------------------------------+
   ```
   ```sql
    SELECT YEAR_FLOOR('2023-07-13', 5, '2016-01-01');
    ```
    ```
    +-----------------------------------------------------------------------------------------+
    | year_floor(cast('2023-07-13' as DATETIMEV2(0)), 5, cast('2016-01-01' as DATETIMEV2(0))) |
    +-----------------------------------------------------------------------------------------+
    | 2021-01-01 00:00:00                                                                     |
    +-----------------------------------------------------------------------------------------+
   ```



