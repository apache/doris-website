---
{
    "title": "条件函数概述",
    "language": "zh-CN",
    "description": "条件函数是用于在 SQL 查询中执行条件逻辑和分支的内置函数。"
}
---

# 条件函数概述

条件函数是用于在 SQL 查询中执行条件逻辑和分支的内置函数。它们帮助根据指定的条件执行不同的操作,例如选择值、处理 NULL 值以及执行基于条件的逻辑判断。

## 向量化执行与条件函数

Doris 是向量化执行的引擎。但是对于条件函数,可能会有一些反直觉的地方。

考虑以下示例:

```sql
mysql> set enable_strict_cast = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Value 128 out of range for type tinyint
```

上面的例子中,虽然我们在 `if` 函数中,`number < 128` 的分支才会被转换为 `tinyint` 类型,但是还是报错了。这是因为对于 `if(cond, colA, colB)` 这个条件函数,传统的执行方式是:

1. 先完整计算 `colA` 和 `colB`
2. 然后根据 `cond` 的值,选择对应的结果返回

所以即使在实际执行中,并没有用到 `colA` 的值,但是因为 `colA` 被完整计算了,所以会报错。

`if`、`ifnull`、`case`、`coalesce` 等函数都有类似的问题。

注意,例如 `LEAST` 这样的函数是没有这样的问题的,因为它本身就需要把所有的参数都计算出来,才能比较大小。

## 短路执行

在 Doris 4.0.3 版本中,我们对条件函数的执行逻辑进行了改进,允许短路执行。

```sql
mysql> set short_circuit_evaluation = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
+-------------------------------------------------------------------------+
| count(if(number < 128, cast(number as tinyint), cast(number as String)))|
+-------------------------------------------------------------------------+
|                                                                      300 |
+-------------------------------------------------------------------------+
```

开启短路执行后,`if`、`ifnull`、`case`、`coalesce` 等函数在很多场景下可以避免不必要的计算,从而避免报错并提升性能。

### 开启短路执行

要开启短路执行,需要设置会话变量:

```sql
SET short_circuit_evaluation = true;
```

### 短路执行的优势

1. **避免错误**:当条件排除某些分支时,避免执行会导致错误的分支
2. **性能提升**:只计算实际需要的分支,减少不必要的计算
3. **更直观的行为**:使条件函数的行为更接近传统编程语言中的条件语句

## 常见条件函数

受益于短路执行的常见条件函数包括:

- `IF`:根据条件返回两个值中的一个
- `IFNULL`:如果第一个参数不为 NULL 则返回第一个参数,否则返回第二个参数
- `CASE`:提供多个条件分支,类似于 switch-case 语句
- `COALESCE`:从参数列表中返回第一个非 NULL 的值
- `NULLIF`:如果两个参数相等则返回 NULL,否则返回第一个参数

有关每个函数的详细信息,请参阅各自的文档页面。
