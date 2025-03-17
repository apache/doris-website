---
{
    "title": "WEEKS_SUB",
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
## Syntax
```sql
WEEKS_SUB([<date_value> | <datetime_value>], <week_period>)
```

## Required parameters
**<week_period>**
> Integer representing the number of weeks to be reduced (positive number means reduction, negative number means increase).

## Optional parameters
- **<date_value>**
    > Date input value of type `DATE`

- **<datetime_value>**
    > Date and time input value of type `DATETIME`


## Example

1. Subtract one week from the datetime `2020-02-02 02:02:02`
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

2. Subtract one week from the date `2020-02-02`
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