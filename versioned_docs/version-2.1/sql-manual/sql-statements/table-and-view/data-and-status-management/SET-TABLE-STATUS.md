---
{
    "title": "SET TABLE STATUS",
    "language": "en"
}
---

## Description

The `SET TABLE STATUS` statement is used to manually set the status of an OLAP table. This statement has the following functionalities:

- It only supports setting the status of OLAP tables.
- It can modify the table status to a specified target state.
- It is used to resolve task blocking caused by the table status.

**Supported States**:

| State             | Description                          |
|-------------------|--------------------------------------|
| NORMAL            | Indicates that the table is in a normal state. |
| ROLLUP            | Indicates that the table is undergoing a ROLLUP operation. |
| SCHEMA_CHANGE     | Indicates that the table is undergoing a schema change. |
| BACKUP            | Indicates that the table is undergoing a backup operation. |
| RESTORE           | Indicates that the table is undergoing a restore operation. |
| WAITING_STABLE    | Indicates that the table is waiting for a stable state. |

## Syntax

```sql
ADMIN SET TABLE <table_name> STATUS PROPERTIES ("<key>" = "<value>" [, ...]);
```

Where:

```sql
<key>
  : "state"

<value>
  : "NORMAL"
  | "ROLLUP"
  | "SCHEMA_CHANGE"
  | "BACKUP"
  | "RESTORE"
  | "WAITING_STABLE"
```

## Required Parameters

**1. `<table_name>`**

> Specifies the name of the table for which the status needs to be set.
>
> The table name must be unique within its database.

**2. `PROPERTIES ("state" = "<value>")`**

> Specifies the target status of the table.
>
> The "state" property must be set, and its value must be one of the supported states.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | System      | The user must have ADMIN privileges to execute this command. |

## Usage Notes

- This command is intended for emergency fault recovery; please use it with caution.
- It only supports OLAP tables and does not support other types of tables.
- If the table is already in the target state, this command will be ignored.
- Improper state settings may lead to system anomalies; it is recommended to use this command under technical support guidance.
- After modifying the status, it is advisable to monitor the system's operational status promptly.

## Examples

- Set the table status to NORMAL:

    ```sql
    ADMIN SET TABLE tbl1 STATUS PROPERTIES("state" = "NORMAL");
    ```

- Set the table status to SCHEMA_CHANGE:

    ```sql
    ADMIN SET TABLE tbl2 STATUS PROPERTIES("state" = "SCHEMA_CHANGE");
    ```
