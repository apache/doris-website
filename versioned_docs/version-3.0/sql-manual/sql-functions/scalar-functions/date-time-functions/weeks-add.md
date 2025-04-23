---
{
   "title": "WEEKS_ADD",
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
This function is used to add (or subtract) a certain number of weeks from a specified date or time value.

## Syntax

```sql
WEEKS_ADD(<datetime_or_date_value>, <weeks_value>)
```

## Required parameters
| Parameter                  | Description                                                                                                                              |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime_or_date_value>` | `DATETIME` or `DATE` type date input value                                                                                               |
| `<weeks_value>`            | Integer, indicating the number of weeks to increase or decrease (positive number indicates increase, negative number indicates decrease) |


## example


1. Add one week to the time `2020-02-02 02:02:02`
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

2. Subtract one week from the time `2020-02-02 02:02:02`
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

3. Add one week to the date `2020-02-02`
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


