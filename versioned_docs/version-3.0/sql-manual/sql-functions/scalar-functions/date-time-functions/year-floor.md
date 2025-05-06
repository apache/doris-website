---
{
    "title": "YEAR_FLOOR",
    "language": "en"
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


## Description
It is used to round the given date down to the specified year interval starting point. It supports multiple variants, which can specify the starting time (origin) and period (period) in different ways to round.

## Syntax

```sql
YEAR_FLOOR(<date_value>, [<period> | <origin_date_value>])
YEAR_FLOOR(<date_value>, <period>, <origin_date_value>)
```

## Parameters
| **Parameter**            | **Type**             | **Description**                                                                                                          |
|--------------------------|----------------------|--------------------------------------------------------------------------------------------------------------------------|
| `<date_value>`           | `DATE`, `DATETIME`   | The `DATE` or `DATETIME` input value to be rounded.                                                                      |
| `<origin_date_value>`    | `DATE`, `DATETIME`   | The `DATE` or `DATETIME` input value used as the reference point. If not provided, the default is `0001-01-01T00:00:00`. |
| `<period>`               | `INT`                | The rounding interval, a positive integer indicating the number of years per cycle.                                      |


## Example
1. Rounding to the whole year
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

2. Round based on origin
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

3. Rounding with period as unit
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

4. Round origin and period
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
