---
{
    "title": "SET LDAP_ADMIN_PASSWORD",
    "language": "en"
}
---

## Description

 The `SET LDAP_ADMIN_PASSWORD` command is used to set the LDAP administrator password. When using LDAP authentication, doris needs to use the administrator account and password to query the LDAP service for login user information.

## Syntax

```sql
 SET LDAP_ADMIN_PASSWORD = PASSWORD('<plain_password>')
```

## Required Parameters

**1. `<plain_password>`**

LDAP administrator password

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes                  |
| :--------------------- | :-------------- | :--------------------- |
| ADMIN_PRIV        | USER or ROLE    | This operation can only be performed by users or roles with `ADMIN_PRIV` permissions |

## Examples

- Set the LDAP administrator password
  ```sql
  SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
  ```
