---
{
    "title": "ADMIN CLEAN TRASH",
    "language": "en",
    "description": "This statement is used to clear garbage data in backend."
}
---

## Description

This statement is used to clear garbage data in backend.

## Syntax

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])]
```

## Optional Parameters

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

Specify the backend to be cleaned up. If you do not add ON, all backend is cleared by default.


## Access Control Requirements

Users executing this SQL command must have at least the following privileges:


| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | User or Role  | Only users or roles with the ADMIN_PRIV privilege can perform the CLEAN TRASH  operation. |


## Examples

```sql
-- Clean up the junk data of all be nodes.
ADMIN CLEAN TRASH;
```

```sql
-- Clean up garbage data for '192.168.0.1:9050' and '192.168.0.2:9050'.
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```