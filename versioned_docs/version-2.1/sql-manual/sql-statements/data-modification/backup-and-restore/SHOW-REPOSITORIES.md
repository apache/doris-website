---
{
    "title": "SHOW REPOSITORIES",
    "language": "en"
}
---

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

