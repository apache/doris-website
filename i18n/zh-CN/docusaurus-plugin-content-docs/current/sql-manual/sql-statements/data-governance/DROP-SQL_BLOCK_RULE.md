---
{
    "title": "DROP SQL_BLOCK_RULE",
    "language": "zh-CN",
    "description": "删除一个或多个 SQL 阻止规则。支持同时删除多个规则，规则名称之间用逗号分隔。"
}
---

## 描述

删除一个或多个 SQL 阻止规则。支持同时删除多个规则，规则名称之间用逗号分隔。

## 语法

```sql
DROP SQL_BLOCK_RULE <rule_name>[, ...]
```

## 必选参数

`<rule_name>` 
需要删除的 SQL 阻止规则名称，多个规则用逗号分隔。 

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限     | 对象         | 说明                                      |
|---------|------------|-----------------------------------------|
| ADMIN  | 用户或角色 | 仅具有 ADMIN 权限的用户或角色可以执行 DROP 操作。 |

## 示例

删除 `test_rule1` 和 `test_rule2` 阻止规则：

```sql
DROP SQL_BLOCK_RULE test_rule1, test_rule2;
```

