---
{
    "title": "REFRESH LDAP",
    "language": "zh-CN",
    "description": "该语句用于刷新 Doris 中 LDAP 的缓存信息。修改 LDAP 服务中用户信息或者修改 Doris 中 LDAP 用户组对应的 role 权限，可能因为缓存的原因不会立即生效，可通过该语句刷新缓存。"
}
---

## 描述

该语句用于刷新 Doris 中 LDAP 的缓存信息。修改 LDAP 服务中用户信息或者修改 Doris 中 LDAP 用户组对应的 role 权限，可能因为缓存的原因不会立即生效，可通过该语句刷新缓存。

## 语法

```sql
REFRESH LDAP [ALL | FOR <user_name>];
```

## 可选参数

**1. `[ALL]`**

是否刷新所有用户的 LDAP 缓存信息。

**2. `<user_name>`**

指定要刷新 LDAP 缓存信息的用户。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：


| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能刷新所有用户的 LDAP 缓存信息，否则只能刷新当前用户的 LDAP 缓存信息|

## 注意事项

- Doris 中 LDAP 信息缓存默认时间为 12 小时，可以通过 `SHOW FRONTEND CONFIG LIKE 'ldap_user_cache_timeout_s';` 查看。
- `REFRESH LDAP ALL` 刷新所有用户的 LDAP 缓存信息，但需要有 `ADMIN_PRIV` 权限。
- 如果指定 `user_name`，则刷新指定用户的 LDAP 缓存信息。
- 如果不指定 `user_name`，则刷新当前用户的 LDAP 缓存信息。

## 示例

1. 刷新所有 LDAP 用户缓存信息

    ```sql
    REFRESH LDAP ALL;
    ```

2. 刷新当前 LDAP 用户的缓存信息

    ```sql
    REFRESH LDAP;
    ```

3. 刷新指定 LDAP 用户 jack 的缓存信息

    ```sql
    REFRESH LDAP FOR jack;
    ```

