---
{
    "title": "DROP FILE",
    "language": "zh-CN",
    "description": "该语句用于删除一个已上传的文件。"
}
---

## 描述

该语句用于删除一个已上传的文件。

## 语法

```sql
DROP FILE "<file_name>" [ { FROM | IN } <database>] PROPERTIES ("<key>"="<value>" [ , ... ])
```

## 必选参数

**1. `<file_name>`**

> 自定义文件名。

**2. `<key>`**

> 文件的属性名。
> - catalog：必须。文件所属分类。

**2. `<value>`**

> 文件的属性值。

## 可选参数

**1. `<database>`**

> 文件归属于某一个 db，如果没有指定，则使用当前 session 的 db。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object）         | 说明（Notes）                    |
|:--------------|:-------------------|:-----------------------------|
| `ADMIN_PRIV`  | 用户（User）或 角色（Role） | 用户或者角色拥有 `ADMIN_PRIV` 权限才能执行 |

## 示例

- 删除文件 ca.pem

  ```sql
  DROP FILE "ca.pem" properties("catalog" = "kafka");
  ```

- 删除文件 client.key，分类为 my_catalog

  ```sql
  DROP FILE "client.key"
  IN my_database
  ```

- 删除文件 client_1.key，分类为 my_catalog

  ```sql
  DROP FILE "client_1.key"
  FROM my_database
  ```

