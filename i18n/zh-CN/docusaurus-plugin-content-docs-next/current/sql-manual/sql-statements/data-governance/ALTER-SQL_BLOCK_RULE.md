---
{
    "title": "ALTER SQL_BLOCK_RULE",
    "language": "zh-CN",
    "description": "该语句用于修改 SQL 阻止规则"
}
---

## 描述

该语句用于修改 SQL 阻止规则

## 语法

```sql
ALTER SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## 必选参数

**1. `<rule_name>`**

> 规则的名字

**2. `<property>`**

具体见[CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md) 的介绍

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象  | 说明 |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV      | 全局           |               |

## 示例

1. 修改 sql 并开启规则
   
  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```