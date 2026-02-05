---
{
    "title": "SHOW CREATE USER",
    "language": "en",
    "description": "SHOW CREATE USER statement is used to display the creation statement of a user in a database system."
}
---

## Description

`SHOW CREATE USER` statement is used to display the creation statement of a user in a database system. It helps administrators manage accounts more effectively.

## Syntax

```sql
SHOW CREATE USER '<user_identity>'
```

## Return Value

| Column         | Description         |
|:------------|:------------|
| User Identity  | specified user identity |
| Create Stmt  | creation statement of the specified user |

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | User or Role    | This `SHOW CREATE USER` operation can only be performed by users or roles with `ADMIN_PRIV` permissions. |


## Examples

To view the creation statement of a specified user.


```sql
SHOW CREATE USER '<user_identity>'
```
  
```text
+---------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| User Identity | Create Stmt                                                                                                                                                                     |
+---------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| xxxxxxx       | CREATE USER 'xxxxxxx'@'%' IDENTIFIED BY ***  PASSWORD_HISTORY DEFAULT PASSWORD_EXPIRE INTERVAL 864000 SECOND FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 86400 SECOND COMMENT "" |
+---------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
