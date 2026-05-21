---
{
    "title": "CLEAN ALL PROFILE",
    "language": "en",
    "description": "This command is used to manually clear all historical query or load profiles."
}
---

## Description

This command is used to manually clear all historical query or load profiles.

## Syntax

```sql
CLEAN ALL PROFILE
```

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege    | Object    | Notes                                                |
|:--------------|:-----------|:-----------------------------------------------------|
| ADMIN_PRIV   | Global    | ADMIN privilege is required to clear all profiles      |

## Examples

```sql
CLEAN ALL PROFILE
```
