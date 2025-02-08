---
{
  "title": "DROP ENCRYPTKEY",
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

Delete a custom key. The name of the key is exactly the same to be deleted.

## Syntax

```sql
DROP ENCRYPTKEY [IF EXISTS] <key_name>
```

## Required Parameters

**1. `<key_name>`**

> Specifies the name of the key to be deleted, which may include a database identifier.
> Example: `db1.my_key`

## Optional Parameters

**1. `[IF EXISTS]`**

> If specified, no error will be thrown when attempting to delete a non-existent key.

## Access Control Requirements

The user executing this SQL command must possess the following minimum privileges:

| Privilege    | Object      | Notes                                                                                   |
|:-------------|:------------|:----------------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | The user or role must hold the`ADMIN_PRIV` privilege to perform key deletion operations |

## Example

- Delete a key

  ```sql
  DROP ENCRYPTKEY my_key;
  ```
- Drop a key without throwing errors if it doesn't exist

  ```sql
  DROP ENCRYPTKEY IF EXISTS testdb.my_key;
  ```
