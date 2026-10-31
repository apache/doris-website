---
{
    "title": "SHOW TRASH",
    "language": "en",
    "description": "This statement is used to view the space occupied by garbage data in backend."
}
---

## Description

This statement is used to view the space occupied by garbage data in backend.

## Syntax

```sql
SHOW TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])];
```

## Optional Parameters

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

Specify the backend that you want to view. If you do not add ON, all backend is displayed by default.


## Access Control Requirements

Users executing this SQL command must have at least the following privileges:


| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV or NODE_PRIV | User or Role  | Only users or roles with the ADMIN_PRIV or NODE_PRIV privilege can perform the SHOW TRASH operation. |


## Examples

1. View the garbage data usage of all be nodes.


```sql
SHOW TRASH;
```

2. View the junk data usage of '192.168.0.1:9050' (disk information is displayed).


```sql
SHOW TRASH ON "192.168.0.1:9050";
```