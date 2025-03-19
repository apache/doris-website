---
{
    "title": "TO_DATE",
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
Date conversion function, used to convert date time (DATETIME) to date type (DATE), that is, remove the time part and keep only the date (YYYY-MM-DD)

## Syntax
```sql
TO_DATE(<datetime_value>)
```

## Required parameter
| Parameter        | Description               |
|-----------------|--------------------------|
| `datetime_value` | DATETIME type date-time |


## Example

Convert `2020-02-02 00:00:00` to `2020-02-02`
```sql
select to_date("2020-02-02 00:00:00");
```
```text
+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+
```

