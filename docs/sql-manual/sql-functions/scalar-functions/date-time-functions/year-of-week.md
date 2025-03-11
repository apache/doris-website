---
{
    "title": "YEAR_OF_WEEK",
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


## year

year_of_week

## Description

Return to the `ISO week date` standard year, please refer to [ISO Week date](https://en.wikipedia.org/wiki/ISO_week_date).

## Alias

- yow

## Syntax

```sql
SMALLINT year_of_week(DATE value)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<value>` | A date for calculate the year of week |

## 返回值

Return to the `ISO week date` standard year

## example

```
mysql> select year_of_week('2005-01-01');
+-----------------------------+
| year_of_week('2005-01-01')  |
+-----------------------------+
|                        2004 |
+-----------------------------+
```

### keywords
    YEAR_OF_WEEK
