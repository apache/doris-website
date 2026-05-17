---
{
    "title": "SHOW ROLES",
    "language": "zh-CN",
    "description": "SHOW ROLES 语句用于展示所有已创建的角色信息，包括角色名称，包含的用户以及权限。"
}
---

## 描述

SHOW ROLES 语句用于展示所有已创建的角色信息，包括角色名称，包含的用户以及权限。

## 语法

```SQL
SHOW ROLES
```

## 返回值

| 列名                   | 类型   | 说明              |
|-----------------------|--------|-------------------|
| Name                  | string | 角色名称           |
| Comment               | string | 注释              |
| Users                 | string | 包含的用户         |
| GlobalPrivs           | string | 全局权限           |
| CatalogPrivs          | string | Catalog 权限       |
| DatabasePrivs         | string | 数据库权限         |
| TablePrivs            | string | 表权限            |
| ResourcePrivs         | string | 资源权限           |
| WorkloadGroupPrivs    | string | WorkloadGroup 权限  |  

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明          |
|:------------|:------------|:--------------|
| GRANT_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 GRANT_PRIV 权限才能进行此操作 |

## 注意事项

Doris 会为每个用户创建一个默认角色，如果想展示出默认角色，可以 ```set show_user_default_role=true;```

## 示例

- 查看已创建的角色

```SQL
SHOW ROLES
```

