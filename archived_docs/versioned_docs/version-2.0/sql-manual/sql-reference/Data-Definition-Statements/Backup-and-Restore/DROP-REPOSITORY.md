---
{
    "title": "DROP-REPOSITORY",
    "language": "en"
}
---

## DROP-REPOSITORY

### Name

DROP REPOSITORY

### Description

This statement is used to delete a created repository. Only root or superuser users can delete repositories.

grammar:

```sql
DROP REPOSITORY `repo_name`;
```

illustrate:

- Deleting a warehouse just deletes the warehouse's mapping in Doris, not the actual warehouse data. Once deleted, it can be mapped to the repository again by specifying the same LOCATION.

### Example

1. Delete the repository named example_repo:

```sql
DROP REPOSITORY `example_repo`;
```

### Keywords

     DROP, REPOSITORY

### Best Practice
