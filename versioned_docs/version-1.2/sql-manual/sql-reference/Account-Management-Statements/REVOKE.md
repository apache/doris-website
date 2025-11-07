---
{
    "title": "REVOKE",
    "language": "en"
}
---

## REVOKE

### Name

REVOKE

### Description

The REVOKE command has the following functions:

1. Revoke the specified permission of a user or a role.
2. Revoke the specified role previously granted to a user.

>Note that.
>
>"Revoke the specified roles previously granted to a user" is supported in versions 2.0 and later

```sql
REVOKE privilege_list ON db_name[.tbl_name] FROM user_identity [ROLE role_name]

REVOKE privilege_list ON RESOURCE resource_name FROM user_identity [ROLE role_name]

REVOKE role_list FROM user_identity
```

user_identity:

The user_identity syntax here is the same as CREATE USER. And must be a user_identity created with CREATE USER. The host in user_identity can be a domain name. If it is a domain name, the revocation time of permissions may be delayed by about 1 minute.

It is also possible to revoke the permissions of the specified ROLE, the executed ROLE must exist.

role_list is the list of roles to be revoked, separated by commas. The specified roles must exist.

### Example

1. Revoke the permission of user jack database testDb

    ```sql
    REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
    ```

2. Revoke user jack resource spark_resource permission

    ```sql
    REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
    ```
3. Revoke the roles role1 and role2 previously granted to jack

    ```sql
    REVOKE 'role1','role2' FROM 'jack'@'192.%';
    ```

### Keywords

    REVOKE

### Best Practice

