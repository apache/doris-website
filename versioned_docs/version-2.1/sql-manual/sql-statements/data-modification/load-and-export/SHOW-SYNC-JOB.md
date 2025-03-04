---
{
    "title": "SHOW SYNC JOB",
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

This statement displays the status of resident data synchronization jobs in all databases.

## Syntax

```sql
SHOW SYNC JOB [FROM <db_name>]
```

## Optional Parameters

**1. `<db_name>`**
> `<db_name>`represents the database name, which is used to specify the database from which the information of the synchronization jobs is to be shown.

## Access Control Requirements  
Users executing this SQL command must have at least one of the following privileges:  

| Privilege                                                                 | Object          | Notes                                   |  
| :------------------------------------------------------------------------ | :------------- | :------------------------------------- |  
| ADMIN_PRIV, SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV, SHOW_VIEW_PRIV | Database `db_name` | This operation requires at least one of the listed privileges on the target database. |  

## Examples

1. Display the status of all data synchronization jobs in the current database.

    ```sql
    SHOW SYNC JOB;
    ```

2. Display the status of all data synchronization jobs in the `test_db` database.

    ```sql
    SHOW SYNC JOB FROM `test_db`;
    ```