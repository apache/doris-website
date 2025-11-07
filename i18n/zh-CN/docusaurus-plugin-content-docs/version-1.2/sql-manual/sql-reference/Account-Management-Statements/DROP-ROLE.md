---
{
    "title": "DROP-ROLE",
    "language": "zh-CN"
}
---

## DROP-ROLE

### Name

DROP ROLE

## 描述

语句用户删除角色

```sql
  DROP ROLE [IF EXISTS] role1;
```

删除角色不会影响以前属于角色的用户的权限。 它仅相当于解耦来自用户的角色。 用户从角色获得的权限不会改变

## 举例

1. 删除一个角色

```sql
DROP ROLE role1;
```

### Keywords

    DROP, ROLE

### Best Practice

