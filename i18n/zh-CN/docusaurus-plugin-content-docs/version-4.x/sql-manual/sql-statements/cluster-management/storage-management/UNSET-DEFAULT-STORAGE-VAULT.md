---
{
    "title": "UNSET DEFAULT STORAGE VAULT",
    "language": "zh-CN",
    "description": "取消已指定的默认 Storage Vault"
}
---

## 描述

取消已指定的默认 Storage Vault

## 语法

```sql
UNSET DEFAULT STORAGE VAULT
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes）                   |
| :---------------- | :------------- | :------------------------------ |
| ADMIN_PRIV        | Storage Vault  | 只有 admin 用户有权限执行该语句 |

## 示例

```sql
UNSET DEFAULT STORAGE VAULT
```