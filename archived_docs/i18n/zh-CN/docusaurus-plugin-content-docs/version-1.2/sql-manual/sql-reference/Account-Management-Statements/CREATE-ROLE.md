---
{
    "title": "CREATE-ROLE",
    "language": "zh-CN"
}
---

## CREATE ROLE

### Name

CREATE ROLE

## 描述

该语句用户创建一个角色

```sql
 CREATE ROLE rol_name;
```

该语句创建一个无权限的角色，可以后续通过 GRANT 命令赋予该角色权限。

## 举例

1. 创建一个角色

    ```sql
    CREATE ROLE role1;
    ```

### Keywords

    CREATE, ROLE

### Best Practice

