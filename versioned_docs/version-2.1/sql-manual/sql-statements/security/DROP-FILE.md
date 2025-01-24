---
{
  "title": "DROP FILE",
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

This statement is used to delete an uploaded file.

## grammar:

```sql
DROP FILE "<file_name>" [ { FROM | IN } <database>] PROPERTIES ("<key>"="<value>" [ , ... ])
```

## Required Parameters

**1. `<file_name>`**

> Custom file name.

**2. `<key>`**

> File attribute key.
> - **catalog**: Required. Classification category of the file.

**3. `<value>`**

> File attribute value.

## Optional Parameters

**1. `<database>`**

> Specifies the database to which the file belongs. Uses the current session's database if not specified.

## Access Control Requirements

The user executing this SQL command must possess the following minimum privileges:

| Privilege    | Object      | Notes                                                                           |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | The user or role must hold the `ADMIN_PRIV` privilege to execute this operation |

## Example

- Delete the file ca.pem

    ```sql
    DROP FILE "ca.pem" properties("catalog" = "kafka");
    ```
- Delete file `client.key` categorized under `my_catalog`

  ```sql
  DROP FILE "client.key"
  IN my_database
  ```

- Delete file `client_1.key` categorized under `my_catalog`

  ```sql
  DROP FILE "client_1.key"
  FROM my_database
  ```
