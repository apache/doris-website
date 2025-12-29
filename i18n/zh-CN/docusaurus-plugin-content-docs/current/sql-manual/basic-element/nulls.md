---
{
    "title": "NULL",
    "language": "zh-CN",
    "description": "如果一行中的某一列没有值，那么就说该列为 NULL。NULL 可以出现在任何没有被“非空”（NOT NULL）限制的数据类型的列中。当实际值未知或者某个值没有意义时，使用 NULL。"
}
---

## NULL 基础介绍

如果一行中的某一列没有值，那么就说该列为 NULL。NULL 可以出现在任何没有被“非空”（NOT NULL）限制的数据类型的列中。当实际值未知或者某个值没有意义时，使用 NULL。

不要使用 NULL 表示数值 0 或者空字符串。它们之间并不相等。

任何包含 NULL 的算术表达式的结果总是 NULL。例如，NULL 加上 10 还是 NULL。事实上，当给定一个 NULL 作为操作数时，所有运算符都返回 NULL。

## NULL 作为函数参数

当给定一个 NULL 作为参数时，大多数标量函数返回 NULL。您可以使用 IFNULL 函数在出现空值时返回一个值。例如，表达式 IFNULL(arg,0) 在 arg 为 NULL 时返回 0，在 arg 不为 NULL 时返回其值。每个函数的具体行为，请参阅“函数”章节

## NULL 和比较运算符

要测试结果是否为 NULL，只能使用比较条件 IS NULL 和 IS NOT NULL。如果使用一个结果取决于 NULL 的条件，则结果为 UNKNOWN。由于 NULL 表示缺少数据，因此 NULL 不能等于或不等于任何值或其他 NULL。

在可比较的场景中（例如嵌套类型比较时，内部的 NULL），NULL 总是被当做小于当前类型可表示的值。即它小于除自身外的任何值：

```sql
select array(null) < array(-1), array(null) > array(-1);
+-------------------------+-------------------------+
| array(null) < array(-1) | array(null) > array(-1) |
+-------------------------+-------------------------+
|                       1 |                       0 |
+-------------------------+-------------------------+

select array(cast("nan" as double)) > array(null);
+--------------------------------------------+
| array(cast("nan" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+

select array(cast("inf" as double)) > array(null);
+--------------------------------------------+
| array(cast("inf" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```

## NULL 在条件中

计算结果为 UNKNOWN 的条件其作用几乎与 FALSE 相同。例如，在 WHERE 子句中包含计算结果为 UNKNOWN 的条件的 SELECT 语句将不返回任何行。但是，计算结果为 UNKNOWN 的条件与 FALSE 的不同之处在于，对 UNKNOWN 条件评估结果进行进一步操作的结果也将评估为 UNKNOWN。因此，NOT FALSE 的计算结果为 TRUE，但 NOT UNKNOWN 的计算结果为 UNKNOWN。

下表显示了条件中涉及 NULL 的各种评估的示例。如果在 SELECT 语句的 WHERE 子句中使用计算结果为 UNKNOWN 的条件，那么该查询将不返回任何行。

| **Condition**   | **Value of A** | **Evaluation** |
| :-------------- | :------------- | :------------- |
| `a IS NULL`     | `10`           | `FALSE`        |
| `a IS NOT NULL` | `10`           | `TRUE`         |
| `a IS NULL`     | `NULL`         | `TRUE`         |
| `a IS NOT NULL` | `NULL`         | `FALSE`        |
| `a = NULL`      | `10`           | `UNKNOWN`      |
| `a != NULL`     | `10`           | `UNKNOWN`      |
| `a = NULL`      | `NULL`         | `UNKNOWN`      |
| `a != NULL`     | `NULL`         | `UNKNOWN`      |
| `a = 10`        | `NULL`         | `UNKNOWN`      |
| `a != 10`       | `NULL`         | `UNKNOWN`      |