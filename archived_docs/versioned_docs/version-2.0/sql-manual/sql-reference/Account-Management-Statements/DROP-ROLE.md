---
{
    "title": "DROP-ROLE",
    "language": "en"
}
---

## DROP-ROLE

### Description

The statement user removes a role

```sql
  DROP ROLE [IF EXISTS] role1;
```

Deleting a role does not affect the permissions of users who previously belonged to the role. It is only equivalent to decoupling the role from the user. The permissions that the user has obtained from the role will not change

### Example

1. Drop a role1

```sql
DROP ROLE role1;
```

### Keywords

    DROP, ROLE

### Best Practice

