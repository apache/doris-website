---
{
    "title": "DROP-TABLE",
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

This statement is used to delete a Table.
## Syntax

```sql
DROP TABLE [IF EXISTS] [<db_name>.]<table_name> [FORCE];
```

## Required Parameters
**1.`<table_name>`**
> Specifies the table identifier (name), which must be unique within the database in which it is located.
>
> Identifiers must begin with an alphabetic character (or any character in a language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g. `My Object`).
>
> Identifiers cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.

## Optional Parameters

**1.`<db_name>`**
> Specifies the identifier (name) for the database.
>
> Identifiers must begin with an alphabetic character (or any character in a given language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Database`).
>
> Identifiers cannot use reserved keywords.
>
> See Identifier Requirements and Reserved Keywords for more details.

**2.`FORCE`**
> If specified, the system will not check whether there are any unfinished transactions in the table. The table will be deleted directly and cannot be recovered. This operation is generally not recommended.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:


| Privilege       | Object    | Notes                      |
|:----------------|:----------|:---------------------------|
| Drop_priv       | Table     | DROP TABLE belongs to the table DROP operation |

## Usage Notes

- After executing `DROP TABLE` for a period of time, the deleted table can be restored by using the RECOVER statement. For details, see the [RECOVER](../../recycle/RECOVER) statement.
- If you execute `DROP TABLE FORCE`, the system will not check whether there are unfinished transactions for the table. The table will be deleted directly and cannot be restored. Generally, this operation is not recommended.

## Examples

1. Deleting a Table

    ```sql
    DROP TABLE my_table;
    ```

2. If it exists, delete the Table of the specified Database.

    ```sql
    DROP TABLE IF EXISTS example_db.my_table;
    ```

3. If it exists, delete the Table of the specified Database, forcibly delete it

    ```sql
    DROP TABLE IF EXISTS example_db.my_table FORCE;
    ```