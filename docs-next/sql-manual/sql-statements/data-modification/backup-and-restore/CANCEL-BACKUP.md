---
{
    "title": "CANCEL BACKUP",
    "language": "en",
    "description": "This statement is used to cancel an ongoing BACKUP task."
}
---

## Description

This statement is used to cancel an ongoing BACKUP task.

## Syntax

```sql
CANCEL [GLOBAL] BACKUP [FROM <db_name>];
```

## Parameters

**1.`<db_name>`**

The name of the database to which the backup task belongs.

## Example

1. Cancel the BACKUP task under example_db.

```sql
CANCEL BACKUP FROM example_db;
```

2. Cancel the GLOBAL BACKUP task.

```sql
CANCEL GLOBAL BACKUP;
```
