---
{
    "title": "SHOW-COLLATION",
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

In Doris, the `SHOW COLLATION` command is used to display the character set collations available in the database. A collation is a set of rules that determine how data is sorted and compared. These rules affect the storage and retrieval of character data. The content returned by this command is only for compatibility with MySQL's behavior. It does not represent the list of character set collations that Doris actually supports. Doris currently mainly supports the proofreading method utf8mb4_0900_bin.

## Syntax

```
SHOW COLLATION
```

## Result Fields

The `SHOW COLLATION` command returns the following fields:

* Collation: The collation name
* Charset: The character set
* Id: The collation's ID
* Default: Whether this is the default collation for the character set
* Compiled: Whether the collation is compiled
* Sortlen: Sort length

### Example

```sql
show collation;
```

```
+-----------------+---------+------+---------+----------+---------+
| Collation       | Charset | Id   | Default | Compiled | Sortlen |
+-----------------+---------+------+---------+----------+---------+
| utf8_general_ci | utf8    |   33 | Yes     | Yes      |       1 |
+-----------------+---------+------+---------+----------+---------+
```

### Notice

In Doris, although it is compatible with MySQL's commands for setting the collation, the setting actually does not take effect. When executed, Doris will always use utf8mb4_0900_bin as the comparison rule.
