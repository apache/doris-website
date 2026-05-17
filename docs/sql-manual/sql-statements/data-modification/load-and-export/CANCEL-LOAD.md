---
{
    "title": "CANCEL LOAD",
    "language": "en",
    "description": "This statement is used to cancel an import job with a specified label, or to cancel import jobs in batches through fuzzy matching."
}
---

## Description

This statement is used to cancel an import job with a specified `label`, or to cancel import jobs in batches through fuzzy matching.

## Syntax

```sql
CANCEL LOAD
[FROM <db_name>]
WHERE [LABEL = "<load_label>" | LABEL like "<label_pattern>" | STATE = { "PENDING" | "ETL" | "LOADING" } ]
```

## Required Parameters

**1. `<db_name>`**

> The name of the database where the import job to be cancelled resides.

## Optional Parameters

**1. `<load_label>`**

> If `LABEL = "<load_label>"` is used, it precisely matches the specified label.

**2. `<label_pattern>`**

> If `LABEL LIKE "<label_pattern>"` is used, it matches import tasks whose labels contain the `label_pattern`.

**3. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> Specifying `PENDING` means cancelling jobs with the `STATE = "PENDING"` status. The same applies to other statuses.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | Import permissions for the database tables are required. |

## Usage Notes

- Cancelling jobs based on the `State` is supported starting from version 1.2.0.
- Only incomplete import jobs in the `PENDING`, `ETL`, or `LOADING` states can be cancelled.
- When performing batch cancellation, Doris does not guarantee that all corresponding import jobs will be cancelled atomically. That is, only some import jobs may be cancelled successfully. Users can check the job status using the `SHOW LOAD` statement and try to execute the `CANCEL LOAD` statement again.

## Examples

1. Cancel the import job with the label `example_db_test_load_label` in the database `example_db`.

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL = "example_db_test_load_label";
   ```

2. Cancel all import jobs containing `example_` in the database `example_db`.

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL like "example_";
   ```

3. Cancel import jobs in the `LOADING` state.

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```