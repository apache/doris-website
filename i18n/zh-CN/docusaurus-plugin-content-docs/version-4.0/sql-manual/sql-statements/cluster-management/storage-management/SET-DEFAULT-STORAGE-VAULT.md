---
{
    "title": "SET DEFAULT STORAGE VAULT",
    "language": "zh-CN"
}
---

## 描述

该语句用于在 Doris 中设置默认存储库。默认存储库用于存储内部或系统表的数据。如果未设置默认存储库，Doris 将无法正常运行。一旦设置了默认存储库，就无法移除它。

## 语法

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## 必选参数

| 参数名称          | 描述                                                         |
|-------------------|--------------------------------------------------------------|
| `<vault_name>`    | 存储库的名称。这是您要设置为默认存储库的唯一标识符。           |

## 注意事项：
> 1. 只有 ADMIN 用户可以设置默认存储库

## 示例

1. 将名为 s3_vault 的存储库设置为默认存储库

   ```sql
   SET s3_vault AS DEFAULT STORAGE VAULT;
   ```

