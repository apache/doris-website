---
{
    "title": "second_floor",
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

## second_floor
### description
#### Syntax

```sql
DATETIME SECOND_FLOOR(DATETIME datetime)
DATETIME SECOND_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME SECOND_FLOOR(DATETIME datetime, INT period)
DATETIME SECOND_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding down time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many seconds each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select second_floor("2023-07-13 22:28:18", 5);
+---------------------------------------------------------------+
| second_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+---------------------------------------------------------------+
| 2023-07-13 22:28:15                                           |
+---------------------------------------------------------------+
1 row in set (0.10 sec)
```

### keywords

    SECOND_FLOOR, SECOND, FLOOR
