---
{
    "title": "REFRESH LDAP",
    "language": "en",
    "description": "This statement is used to refresh the cache information of LDAP in Doris."
}
---

## Description

This statement is used to refresh the cache information of LDAP in Doris. When modifying user information in the LDAP service or modifying the role permissions corresponding to LDAP user groups in Doris, the changes may not take effect immediately due to caching, and the cache can be refreshed through this statement.

## Syntax

```sql
REFRESH LDAP [ALL | FOR <user_name>];
```

## Optional Parameters

**1. `[ALL]`**

Whether to refresh the LDAP cache information of all users.

**2. `<user_name>`**

The user whose LDAP cache information needs to be refreshed

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:


| Privilege | Object | Notes                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | User or Role | Only users or roles with the `ADMIN_PRIV` permission can refresh the LDAP cache information of all users. Otherwise, they can only refresh the LDAP cache information of the current user |

## Usage Notes

- The default timeout for LDAP information cache in Doris is 12 hours, which can be viewed by `SHOW FRONTEND CONFIG LIKE 'ldap_user_cache_timeout_s';`.
- `REFRESH LDAP ALL` refreshes the LDAP cache information of all users, but requires the `ADMIN_PRIV` permission.
- If `user_name` is specified, the LDAP cache information of the specified user will be refreshed.
- If `user_name` is not specified, the LDAP cache information of the current user will be refreshed.

## Examples

1. Refresh the cache information of all LDAP users.

    ```sql
    REFRESH LDAP ALL;
    ```

2. Refresh the cache information of the current LDAP user.

    ```sql
    REFRESH LDAP;
    ```

3. Refresh the cache information of the specified LDAP user jack.

    ```sql
    REFRESH LDAP FOR jack;
    ```

