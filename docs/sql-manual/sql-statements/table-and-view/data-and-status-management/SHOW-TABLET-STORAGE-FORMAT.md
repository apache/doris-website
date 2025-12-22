---
{
    "title": "SHOW TABLET STORAGE FORMAT",
    "language": "en",
    "description": "This statement is used to display storage format information on the Backend."
}
---

## Description

This statement is used to display storage format information on the Backend.

## Syntax

```sql
SHOW TABLET STORAGE FORMAT [VERBOSE]
```


## Optional Parameters

** 1. `VERBOSE` **

  Displays more detailed information.

## Return Value

| Column        | DataType | Note                                                                 |
|---------------|----------|----------------------------------------------------------------------|
| BackendId     | Int      | The ID of the BE (Backend) node where the tablet replica is located. |
| V1Count       | Int      | Number of V1 version tablets.                                        |
| V2Count       | Int      | Number of V2 version tablets.                                        |
| TabletId      | Int      | The unique identifier of the tablet.                                 |
| StorageFormat | String   | The version of the tablet, either V1 or V2.                          |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples

- Execute the statement without the verbose parameter

  ```sql
  show tablet storage format;
  ```

  ```text
  +-----------+---------+---------+
  | BackendId | V1Count | V2Count |
  +-----------+---------+---------+
  | 10002     | 0       | 2867    |
  +-----------+---------+---------+
  ```

- Execute the statement with the verbose parameter

  ```sql
  show tablet storage format verbose;
  ```

  ```text
  +-----------+----------+---------------+
  | BackendId | TabletId | StorageFormat |
  +-----------+----------+---------------+
  | 10002     | 39227    | V2            |
  | 10002     | 39221    | V2            |
  | 10002     | 39215    | V2            |
  | 10002     | 39199    | V2            |
  +-----------+----------+---------------+
  ```