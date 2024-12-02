---
{
    "title": "USE COMPUTE GROUP",
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

In the storage-and-compute-separated version, specify the compute cluster to use.

## Syntax


```sql
USE { [ <catalog_name>. ]<database_name>[ @<compute_group_name> ] | @<compute_group_name> }
```

## Required Parameters

`<compute_group_name>`： The name of the compute cluster.

## Return Value

If the compute cluster switch is successful, it returns "Database changed"; if the switch fails, it returns the corresponding error message.

## Examples

1. Specify the compute cluster `compute_cluster` to use:

    ```sql
    use @compute_cluster;
    Database changed
    ```

2. Specify both the database `mysql` and the compute cluster `compute_cluster` to use:

    ```sql
    use mysql@compute_cluster
    Database changed
    ```

## Permission Control

The prerequisite for successfully executing this SQL command is to have the USAGE_PRIV permission for the compute group, refer to the permission documentation.

| Privilege  | Object        | Notes                                 |
| :--------- | :------------ | :------------------------------------ |
| USAGE_PRIV | Compute group | Permission to use the compute cluster |

If a user does not have the compute group permission and tries to specify a compute group, an error will be reported. For example, `test` is a regular user without compute group permission:

```sql
mysql -utest -h175.40.1.1 -P9030

use @compute_cluster;
ERROR 5042 (42000): errCode = 2, detailMessage = USAGE denied to user test'@'127.0.0.1' for compute group 'compute_cluster'
```


## Notes

1. If the database name or compute group name is a reserved keyword, it needs to be enclosed in backticks, for example:

    ```sql
    use @`create`
    ```

2. If the compute group does not exist, an error message will be returned:

    ```sql
    mysql> use @compute_group_not_exist;
    ERROR 5098 (42000): errCode = 2, detailMessage = Compute Group compute_group_not_exist not exist
    ```