---
{
    "title": "CREATE DATA MASK POLICY",
    "language": "zh-CN",
    "description": "创建列脱敏策略，Explain 可以查看改写后的执行计划。"
}
---

## 描述

创建列脱敏策略，Explain 可以查看改写后的执行计划。

## 语法

```sql
CREATE DATA MASK POLICY [ IF NOT EXISTS ] <policy_name> 
ON <col_name> 
TO { <user_name> | ROLE <role_name> } 
USING <mask_type> [LEVEL <priority>];
```

## 必选参数

1. `<policy_name>`: 列脱敏策略名称

2. `<col_name>`: 列名称

3. `<mask_type>`: 具体的脱敏类型，见：MASK_TYPE 列表

## 可选参数

1. `<user_name>`: 用户名称，不允许对 root 和 admin 用户创建

2. `<role_name>`: 角色名称

3. `<priority>`: 脱敏优先级，默认为 0，如果某个列有多个脱敏策略，值越大，优先级越高

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）          | 对象（Object） | 说明（Notes） |
| :------------------------- | :------------- | :------------ |
| ADMIN_PRIV 或 *GRANT_PRIV* | 全局           |               |

## MASK_TYPE
| 名称                        | 含义                            | 表达式                                                                                                |
|:--------------------------|:------------------------------|:---------------------------------------------------------------------------------------------------|
| MASK_REDACT | 写字母用 x 代替，大写字母用 X 代替，数字用 0 代替 | regexp_replace(regexp_replace(regexp_replace({col},'([A-Z])', 'X'),'([a-z])','x'),'([0-9])','0')   |
| MASK_SHOW_LAST_4 | 只显示最后4个字符，其他用 X 代替            | LPAD(RIGHT({col}, 4), CHAR_LENGTH({col}), 'X')                                                     |
| MASK_SHOW_FIRST_4 | 只显示前4个字符，其他用 X 代替             | RPAD(LEFT({col}, 4), CHAR_LENGTH({col}), 'X')                                                      |
| MASK_HASH | 使用 sha256 对值进行 hash           |    hex(sha2({col}, 256))           |
| MASK_NULL | 使用 NULL 对值进行覆盖                |    NULL           |
| MASK_DATE_SHOW_YEAR | 对日期类型，只显示年份                   |    date_trunc({col}, 'year')           |
| MASK_DEFAULT | 显示字段类型的默认值                    |               |
| MASK_NONE | 保持原样                          |               |

## 示例

1. 创建一组行安全策略

    ```sql
    CREATE DATA MASK POLICY test_policy_1 ON internal.test.t1.c1
    TO jack USING MASK_HASH;
    
    CREATE DATA MASK POLICY test_policy_2 ON internal.test.t1.c2
    TO Role r1 USING MASK_NULL;
    
    CREATE DATA MASK POLICY test_policy_3 ON internal.test.t1.c1
    TO jack USING MASK_NONE LEVEL 1;
   
    ```
