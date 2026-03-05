---
{
    "title": "CANCEL RESTORE",
    "language": "en",
    "description": "This statement is used to cancel an ongoing RESTORE task."
}
---

## Description

This statement is used to cancel an ongoing RESTORE task.

## Syntax

```sql
CANCEL [GLOBAL] RESTORE [FROM <db_name>];
```

## Parameters

**1.`<db_name>`**

The name of the database to which the recovery task belongs.

## Usage Notes

- When cancellation is around a COMMIT or later stage of recovery, the table being recovered may be rendered inaccessible. At this time, data recovery can only be performed by executing the recovery job again.

## Example

1. Cancel the RESTORE task under example_db.

```sql
CANCEL RESTORE FROM example_db;
```

2. Cancel the GLOBAL RESTORE task.

```sql
CANCEL GLOBAL RESTORE;
```
