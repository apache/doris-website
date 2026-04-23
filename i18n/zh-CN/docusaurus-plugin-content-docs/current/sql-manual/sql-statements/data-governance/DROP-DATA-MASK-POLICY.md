---
{
    "title": "DROP DATA MASK POLICY",
    "language": "zh-CN",
    "description": "删除列脱敏策略。"
}
---

## 描述
删除列脱敏策略。

## 语法

```sql
DROP ROW POLICY [IF EXISTS] <policy_name>;
```

## 必选参数

1. `<policy_name>`: 列脱敏策略名称


## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）          | 对象（Object） | 说明（Notes） |
| :------------------------- | :------------- | :------------ |
| ADMIN_PRIV 或 *GRANT_PRIV* | 全局           |               |

## 示例

1. 删除 *policy1 列脱敏策略*

    ```sql
    DROP DATA MASK POLICY policy1
    ```
