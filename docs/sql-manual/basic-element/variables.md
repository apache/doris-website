---
{
    "title": "Variables",
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

In Doris, variables are divided into system variables and user variables. Both are case-insensitive.

System variables affect the behavior of Doris. Both system variables and user variables can be used in user queries.

## System Variables

System variables are a set of variables predefined by Doris to control database behavior and performance. The main features are as follows:

- Variable Types:

    - Read-only variables: These variables are set by the system and cannot be modified by users, such as `version`, `current_timestamp`, etc.

    - Modifiable variables: Users can modify the values of these variables at runtime, such as `exec_mem_limit`, `time_zone`, etc.

- Scope:

    - Global variables (Global): Affect all sessions and set with `SET GLOBAL`.

    - Session variables (Session): Only affect the current session and set with `SET`.

    - Some variables have both global and session scopes.

- Access Methods:

    - Use `SHOW VARIABLES` to view all system variables.

    - Use `SHOW VARIABLES LIKE 'pattern'` to view specific variables by pattern matching.

- Persistence:

    - Modifications to global variables are reset to default values after a system restart; session restarts do not reset to default values.

    - Changes to session variables are lost after the session ends.

## User-Defined Variables

User-defined variables are a mechanism for temporarily storing data within a session. The main features are as follows:

- Naming Rules:

    - Must be prefixed with `@`.

    - Variable names can include letters, numbers, and underscores.

    - Case-insensitive.

- Scope:

    - Only valid within the current session.

    - Automatically destroyed after the session ends.

    - Variables with the same name in different sessions are independent of each other.

- Assignment Methods:

    - Use `SET @var_name = value` syntax for assignment.

    - Supports assigning values using expression results.

- Data Types:

    - Can store numbers (integers, floating-point numbers).

    - Can store strings.

    - Can store date-time values.

    - Can store NULL values.

    - The type is automatically determined at assignment.

## System Variable Definitions and Query Statements

- SHOW VARIABLES

    You can view variables with `SHOW VARIABLES LIKE 'variable_name'`.

    ```sql
    SHOW VARIABLES LIKE '%time_zone%';
    +------------------+----------------+----------------+---------+
    | Variable_name    | Value          | Default_Value  | Changed |
    +------------------+----------------+----------------+---------+
    | system_time_zone | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    | time_zone        | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    +------------------+----------------+----------------+---------+
    ```

    Or view all variables with `SHOW VARIABLES`.

    ```sql
    SHOW VARIABLES
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    | Variable_name                                                    | Value                                 | Default_Value                         | Changed |
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    | DML_PLAN_RETRY_TIMES                                             | 3                                     | 3                                     | 0       |
    | adaptive_pipeline_task_serial_read_on_limit                      | 10000                                 | 10000                                 | 0       |
    | allow_modify_materialized_view                              | false                                 | false                                 | 0       |
    | allow_partition_column_nullable                            | true                                  | true                                  | 0       |
    | analyze_timeout                                           | 43200                                 | 43200                                 | 0       |
    | version                                                      | 5.7.99                                | 5.7.99                                | 0       |
    | version_comment                                                | Doris version doris0.0.0--de61c5823 | Doris version doris-0.0--de61c5823 | 0       |
    | wait_full_block_schedule_times                                 | 2                                     | 2                                     | 0       |
    | wait_timeout                                               | 28800                                 | 28800                                 | 0       |
    | workload_group                                                 |                                       |                                       | 0       |
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    360 rows in set (0.01 sec)
    ```

- SET

    Some variables can be set to take effect globally or only in the current session.

    Set to take effect only in the current session with `SET`. For example:

    ```sql
    SET exec_mem_limit = 137438953472;
    SHOW VARIABLES LIKE '%exec_mem_limit%';
    +----------------+--------------+---------------+---------+
    | Variable_name  | Value        | Default_Value | Changed |
    +----------------+--------------+---------------+---------+
    | exec_mem_limit | 137438953472 | 2147483648    | 1       |
    +----------------+--------------+---------------+---------+
    1 row in set (0.01 sec)
    SET forward_to_master = true;
    SHOW VARIABLES LIKE '%forward_to_master%';
    +-------------------+-------+---------------+---------+
    | Variable_name     | Value | Default_Value | Changed |
    +-------------------+-------+---------------+---------+
    | forward_to_master | true  | true          | 0       |
    +-------------------+-------+---------------+---------+
    1 row in set (0.00 sec)
    SET time_zone = "Asia/Shanghai";
    SHOW VARIABLES LIKE '%time_zone%';
    +------------------+----------------+----------------+---------+
    | Variable_name    | Value          | Default_Value  | Changed |
    +------------------+----------------+----------------+---------+
    | time_zone        | Asia/Shanghai  | Asia/Hong_Kong | 1       |
    | system_time_zone | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    +------------------+----------------+----------------+---------+
    2 rows in set (0.00 sec)
    ```

    Set globally

    ```sql
    SET GLOBAL exec_mem_limit = 137438953472;
    SHOW VARIABLES LIKE '%exec_mem_limit%';
    +----------------+--------------+---------------+---------+
    | Variable_name  | Value        | Default_Value | Changed |
    +----------------+--------------+---------------+---------+
    | exec_mem_limit | 137438953472 | 2147483648    | 1       |
    +----------------+--------------+---------------+---------+
    1 row in set (0.01 sec)
    ```

- UNSET

    Syntax:

    ```sql
    UNSET (GLOBAL | SESSION | LOCAL)? VARIABLE (ALL | identifier)
    unset global variable exec_mem_limit;
    SHOW VARIABLES LIKE '%exec_mem_limit%';
    +----------------+------------+---------------+---------+
    | Variable_name  | Value      | Default_Value | Changed |
    +----------------+------------+---------------+---------+
    | exec_mem_limit | 2147483648 | 2147483648    | 0       |
    +----------------+------------+---------------+---------+
    1 row in set (0.00 sec)
    ```

## User Variable Definition and Query Statements

User-defined variables can be defined with the following statement:

```sql
SET @var_name = constant_value|constant_expr;
```

Setting examples:

```sql
SET @v1 = "A";
SET @v2 = 32+33;
SET @v3 = str_to_date("2024-12-29 10:11:12", '%Y-%m-%d %H:%i:%s');
```

Can be used in queries

```sql
SELECT @v1, @v2, @v3;
+------+------+--------------------+
| @v1  | @v2  | @v3                 |
+------+------+--------------------+
| A    |   65 | 2024-12-29 10:11:12 |
+------+------+--------------------+
1 row in set (0.01 sec)
```