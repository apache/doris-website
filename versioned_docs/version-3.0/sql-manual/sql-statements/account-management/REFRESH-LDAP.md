---
{
    "title": "REFRESH LDAP",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

This statement is used to refresh the cache information of LDAP in Doris. When modifying user information in the LDAP service or modifying the role permissions corresponding to LDAP user groups in Doris, the changes may not take effect immediately due to caching, and the cache can be refreshed through this statement.

## Syntax

```sql
REFRESH LDAP [ALL | FOR <user_name>];
```

## Optional Parameters

**`<user_name>`**

The user whose LDAP cache information needs to be refreshed.

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

