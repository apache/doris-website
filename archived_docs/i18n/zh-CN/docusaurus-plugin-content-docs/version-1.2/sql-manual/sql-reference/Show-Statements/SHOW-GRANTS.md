---
{
    "title": "SHOW-GRANTS",
    "language": "zh-CN"
}
---

## SHOW-GRANTS

### Name

SHOW GRANTS

## 描述

 该语句用于查看用户权限。

语法：

```sql
SHOW [ALL] GRANTS [FOR user_identity];
```

说明：

1. SHOW ALL GRANTS 可以查看所有用户的权限。
2. 如果指定 user_identity，则查看该指定用户的权限。且该 user_identity 必须为通过 CREATE USER 命令创建的。
3. 如果不指定 user_identity，则查看当前用户的权限。

## 举例

1. 查看所有用户权限信息

   ```sql
   SHOW ALL GRANTS;
   ```

2. 查看指定 user 的权限

    ```sql
    SHOW GRANTS FOR jack@'%';
    ```

3. 查看当前用户的权限

   ```sql
   SHOW GRANTS;
   ```

### Keywords

    SHOW, GRANTS

### Best Practice

