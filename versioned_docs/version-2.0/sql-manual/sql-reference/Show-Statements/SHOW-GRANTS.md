---
{
    "title": "SHOW-GRANTS",
    "language": "en"
}
---

## SHOW-GRANTS

### Name

SHOW GRANTS

### Description

  This statement is used to view user permissions.

grammar:

```sql
SHOW [ALL] GRANTS [FOR user_identity];
```

illustrate:

1. SHOW ALL GRANTS can view the permissions of all users.
2. If user_identity is specified, view the permissions of the specified user. And the user_identity must be created by the CREATE USER command.
3. If user_identity is not specified, view the permissions of the current user.

### Example

1. View all user permission information

    ```sql
    SHOW ALL GRANTS;
    ```

2. View the permissions of the specified user

    ```sql
    SHOW GRANTS FOR jack@'%';
    ```

3. View the permissions of the current user

    ```sql
    SHOW GRANTS;
    ```

### Keywords

    SHOW, GRANTS

### Best Practice

