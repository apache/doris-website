---
{
    "title": "SHOW-REPOSITORIES",
    "language": "en"
}
---

## SHOW-REPOSITORIES

### Name

SHOW REPOSITORIES

### Description

This statement is used to view the currently created warehouse

grammar:

```sql
SHOW REPOSITORIES;
```

illustrate:

1. The meanings of the columns are as follows:
        RepoId: Unique repository ID
        RepoName: repository name
        CreateTime: The time when the repository was first created
        IsReadOnly: Whether it is a read-only repository
        Location: The root directory in the warehouse for backing up data
        Broker: Dependent Broker
        ErrMsg: Doris will regularly check the connectivity of the warehouse, if there is a problem, an error message will be displayed here

### Example

1. View the created repository:

```sql
  SHOW REPOSITORIES;
```

### Keywords

    SHOW, REPOSITORIES

### Best Practice

