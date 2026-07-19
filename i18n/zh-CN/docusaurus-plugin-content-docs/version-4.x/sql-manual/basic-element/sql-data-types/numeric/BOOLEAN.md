---
{
    "title": "BOOLEAN",
    "language": "zh-CN",
    "description": "BOOL, BOOLEAN 与TINYINT一样，0代表false，1代表true"
}
---

## 描述

BOOLEAN 是 Doris 中表示布尔值的数据类型：真值和假值。

在内部，BOOLEAN 被存储为 uint8 值，其中 0 表示 false（假），1 表示 true（真）。

与 MySQL 中 BOOLEAN 是 TINYINT(1) 的别名不同，Doris 将 BOOLEAN 作为一个独立的数据类型处理，类似于 PostgreSQL、Oracle 和其他数据库系统。

## 取值范围

BOOLEAN 值只能是：
- `true`（显示时表示为 1）
- `false`（显示时表示为 0）

在内存中，BOOLEAN 类型只存在 0 或 1，没有其他可能的值。

## 字面量

在 Doris 中，您可以使用关键字 `true` 和 `false`（不区分大小写）来表示布尔字面量：

```sql
mysql> select TrUe, False, true;
+------+-------+------+
| TrUe | False | true |
+------+-------+------+
|    1 |     0 |    1 |
+------+-------+------+
```

## 支持的操作

### 逻辑运算

BOOLEAN 类型支持逻辑运算，如 AND、OR、NOT 和 XOR：

```sql
mysql> select true AND false, true OR false, NOT true, true XOR false;
+----------------+---------------+----------+----------------+
| true AND false | true OR false | NOT true | true XOR false |
+----------------+---------------+----------+----------------+
|              0 |             1 |        0 |              1 |
+----------------+---------------+----------+----------------+
```

### 算术运算

虽然 BOOLEAN 类型不直接支持算术运算，但像 `true + true` 这样的表达式会由于隐式类型转换而生效：

```sql
mysql> select true + true;
+-------------+
| true + true |
+-------------+
|           2 |
+-------------+
```

这是因为布尔值被隐式转换为 SMALLINT：`CAST(TRUE AS smallint) + CAST(TRUE AS smallint)`。

## 类型转换

需要注意的是，在 Doris 中，BOOLEAN 与 TINYINT 不等价，尽管它们由于 MySQL 的习惯可能看起来相似。

当将布尔字面量插入到 TINYINT 列时，会发生隐式类型转换：

```sql
CREATE TABLE test_boolean(
    u8 TINYINT
)
properties("replication_num" = "1");

mysql> insert into test_boolean values(true);
```

在这个例子中，布尔字面量 `true` 被转换为 TINYINT 值。

## 关键字

BOOL, BOOLEAN
