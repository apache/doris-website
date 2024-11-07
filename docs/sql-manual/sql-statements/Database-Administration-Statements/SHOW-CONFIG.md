---
{
    "title": "SHOW-CONFIG",
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

## SHOW-CONFIG

### Name

SHOW CONFIG

### Description

This statement is used to display the configuration of the current cluster.

grammar:

```sql
SHOW (FRONTEND|BACKEND)  CONFIG [LIKE "pattern"];
````

The columns in the results of showing FE configuration have the following meanings:

1. Key: Configuration item name
2. Value: Configuration item value
3. Type: Configuration item type
4. IsMutable: Whether it can be set by ADMIN SET CONFIG command
5. MasterOnly: Is it only applicable to Master FE
6. Comment: Configuration item description

The columns in the results of showing BE configuration have the following meanings:

1. BackendId: ID of a backend
2. Host: Host of a backend 
3. Key: Configuration item name
4. Value: Configuration item value
5. Type: Configuration item type
6. IsMutable: Whether it can be modified

### Example

1. View the configuration of the current FE node

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. Use the like predicate to search the configuration of the current Fe node

   ```
   mysql> SHOW FRONTEND CONFIG LIKE '%check_java_version%';
   +--------------------+-------+---------+---------- -+------------+---------+
   | Key | Value | Type | IsMutable | MasterOnly | Comment |
   +--------------------+-------+---------+---------- -+------------+---------+
   | check_java_version | true | boolean | false | false | |
   +--------------------+-------+---------+---------- -+------------+---------+
   1 row in set (0.01 sec)
   ```

3. View the configuration for a specific BE using the backend ID `10001`

    ```sql
    SHOW BACKEND CONFIG FROM 10001;
    ```
4. View the configuration useing both a pattern and a backend ID
    ```
    mysql> SHOW BACKEND CONFIG LIKE "be_port" FROM 10001;
    +-----------+---------------+---------+-------+---------+-----------+
    | BackendId | Host          | Key     | Value | Type    | IsMutable |
    +-----------+---------------+---------+-------+---------+-----------+
    | 10001     | xx.xx.xxx.xxx | be_port | 9060  | int32_t | false     |
    +-----------+---------------+---------+-------+---------+-----------+
    ```


### Keywords

    SHOW, CONFIG

### Best Practice

