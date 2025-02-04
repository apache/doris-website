---
{
    "title": "SHOW CHARSET",
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

The "SHOW CHARSET" command is used to display the character sets available in the current database management system and some properties associated with each character set.

These properties may include the name of the character set, default collation, maximum byte length, etc. A list of character sets supported on the system and their details can be viewed by running the "SHOW CHARSET" command.

## Syntax
```sql
SHOW CHARSET
```

## Return Value
| column name | description |
| -- |-------------|
| Charset | Character Set         |
| Description | Description          |
| Default Collation | Default collation name      |
| Maxlen | Maximum byte length      |

## Examples

```sql
SHOW CHARSET;
```

```text
+---------+---------------+-------------------+--------+
| Charset | Description   | Default collation | Maxlen |
+---------+---------------+-------------------+--------+
| utf8mb4 | UTF-8 Unicode | utf8mb4_0900_bin  | 4      |
+---------+---------------+-------------------+--------+
```

