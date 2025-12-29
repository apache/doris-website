---
{
    "title": "DROP VIEW",
    "language": "en",
    "description": "Delete a view in the current or specified database."
}
---

## Description

Delete a view in the current or specified database.

## Syntax

```sql
DROP VIEW [ IF EXISTS ] <name>
```
## Required Parameters

The name of the view to be deleted.

## Optional Parameters

**[ IF EXISTS ]**

If this parameter is specified, no error will be thrown when the view does not exist, and the deletion operation will be skipped directly.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| DROP_PRIV | Table  |       |

## Usage Notes

Deleted views cannot be restored and must be recreated.

## Examples

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
DROP VIEW IF EXISTS vtest;
```