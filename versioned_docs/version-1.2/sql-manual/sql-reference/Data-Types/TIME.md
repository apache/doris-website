---
{
    "title": "TIME",
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

## TIME

### name

TIME

### description

TIME type
    `TIME` type that can appear as a query result. Table storage and manual CAST generation are not supported.
    When calculating without constant folding, it could represent `[-838:59:59, 838:59:59]`。

### example

```sql
mysql [(none)]> select timediff('2020-01-01', '2000-01-01');
+--------------------------------------------------------+
| timediff('2020-01-01 00:00:00', '2000-01-01 00:00:00') |
+--------------------------------------------------------+
| 175320:00:00                                           |
+--------------------------------------------------------+
1 row in set (0.00 sec)
```

### keywords

    TIME
