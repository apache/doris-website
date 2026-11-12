---
{
    "title": "DROP-USER",
    "language": "zh-CN"
}
---

## DROP-USER

### Name

DROP USER

## 描述

删除一个用户

```sql
 DROP USER 'user_identity'

    `user_identity`:
    
        user@'host'
        user@['domain']
```

 删除指定的 user identitiy.

## 举例

1. 删除用户 jack@'192.%'

    ```sql
    DROP USER 'jack'@'192.%'
    ```

### Keywords

    DROP, USER

### Best Practice

