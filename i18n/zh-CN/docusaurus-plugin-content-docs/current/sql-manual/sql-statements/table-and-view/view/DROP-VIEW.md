---
{
    "title": "DROP VIEW",
    "language": "zh-CN",
    "description": "在当前或指定的数据库中删除一个视图。"
}
---

## 描述

在当前或指定的数据库中删除一个视图。

## 语法

```sql
DROP VIEW [ IF EXISTS ] <name>
```

## 必选参数

`<name>`  : 要删除的视图名称。

## 可选参数

`[IF EXISTS]`

如果指定此参数，当视图不存在时不会抛出错误，而是直接跳过删除操作。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| DROP_PRIV         | 表（Table）    |               |

## 注意事项

已删除的视图无法恢复，必须重新创建。

## 示例

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
DROP VIEW IF EXISTS vtest;
```


