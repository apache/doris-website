---
{
    "title": "REFRESH-LDAP",
    "language": "en"
}
---

## REFRESH-LDAP

### Name


REFRESH-LDAP



### Description

This statement is used to refresh the cached information of LDAP in Doris. The default timeout for LDAP information cache in Doris is 12 hours, which can be viewed by `ADMIN SHOW FRONTEND CONFIG LIKE 'ldap_ user_cache_timeout_s';`.

syntax:

```sql
REFRESH LDAP ALL;
REFRESH LDAP [for user_name];
```

### Example

1. refresh all LDAP user cache information

    ```sql
    REFRESH LDAP ALL;
    ```

2. refresh the cache information for the current LDAP user

    ```sql
    REFRESH LDAP;
    ```

3. refresh the cache information of the specified LDAP user user1

    ```sql
    REFRESH LDAP for user1;
    ```


### Keywords

REFRESH, LDAP

### Best Practice
