---
{
    "title": "DROP REPOSITORY",
    "language": "en",
    "description": "This statement is used to delete a created repository."
}
---

## Description

This statement is used to delete a created repository.

## Syntax

```sql
DROP REPOSITORY <repo_name>;
```

## Required Parameters
**<repo_name>**
> The unique name of the repository.

## Access Control Requirements

| Privilege               | Object                         | Notes                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | Entire cluster management permissions | Only the root or superuser can create repositories  |


## Usage notes
- Deleting the repository only removes its mapping in Doris and does not delete the actual repository data. After deletion, the repository can be mapped again by specifying the same LOCATION.

## Examples

Delete the repository named example_repo:

```sql
DROP REPOSITORY `example_repo`;
```