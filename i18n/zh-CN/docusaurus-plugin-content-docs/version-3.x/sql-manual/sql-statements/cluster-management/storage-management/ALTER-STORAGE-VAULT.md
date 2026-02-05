---
{
    "title": "ALTER STORAGE VAULT",
    "language": "zh-CN",
    "description": "更改 Storage Vault 的可修改属性值"
}
---

## 描述

更改 Storage Vault 的可修改属性值

## 语法

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## 必选参数

**<storage_vault_property>**

> - type：可选值为 s3, hdfs. 这个字段从3.0.8之后是选填字段.
> 
>
> 当 type 为 s3 时，允许出现的属性字段如下：
>
> - s3.access_key：s3 vault 的 ak
> - s3.secret_key：s3 vault 的 sk
> - vault_name：vault 的名字。当一个 vault 通过`SET <original_vault_name> DEFAULT STORAGE VAULT`语句被设为默认存储 vault 时，不能修改其名称。若需修改名称，需首先通过`UNSET DEFAULT STORAGE VAULT`命令取消默认存储 vault 设置，再执行重命名操作。最后，若要将重命名后的 vault 设为默认存储 vault，可通过执行`SET <new_vault_name> AS DEFAULT STORAGE VAULT`语句完成设置。
> - use_path_style：是否允许 path style url，可选值为 true，false。默认值是 false。
>
>
>
> 当 type 为 hdfs 时，禁止出现的字段：
>
> - path_prefix：存储路径前缀
> - fs.defaultFS：hdfs name

## 权限控制

执行此 SQL 命令的用户必须至少具有 ADMIN_PRIV 权限。

## 示例

修改 s3 storage vault ak

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

修改 hdfs storage vault

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
