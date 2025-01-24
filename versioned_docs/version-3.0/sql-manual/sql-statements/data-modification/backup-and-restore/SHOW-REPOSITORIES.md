---
{
    "title": "SHOW REPOSITORIES",
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

This statement is used to view the currently created warehouse

## Syntax

```sql
SHOW REPOSITORIES;
```

## Return Value

| Field           | Description                              |
|-----------------|------------------------------------------|
| **RepoId**      | The unique identifier (ID) of the repository |
| **RepoName**    | The name of the repository               |
| **CreateTime**  | The creation time of the repository      |
| **IsReadOnly**  | Whether the repository is read-only. `false` means not read-only, `true` means read-only |
| **Location**    | The root directory used for backing up data in the repository |
| **Broker**      | -                                        |
| **Type**        | The repository type, currently supporting S3 and HDFS |
| **ErrMsg**      | The error message of the repository. Typically `NULL` if no error occurs |


## Examples

View the created repository:

```sql
SHOW REPOSITORIES;
```
```text
+--------+--------------+---------------------+------------+----------+--------+------+--------+
| RepoId | RepoName     | CreateTime          | IsReadOnly | Location | Broker | Type | ErrMsg |
+--------+--------------+---------------------+------------+----------+--------+------+--------+
| 43411  | example_repo | 2025-01-17 18:50:47 | false      | s3://rep1  | -      | S3   | NULL   |
+--------+--------------+---------------------+------------+----------+--------+------+--------+
```

