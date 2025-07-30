---
{
    "title": "EXPLODE_NUMBERS",
    "language": "zh-CN"
}
---

## 描述

 `explode_numbers` 表函数，接受一个整数 n，将范围的所有数字展开为多行，每行一个数字。常用于生成连续数字的序列，配合 LATERAL VIEW 使用。
 
 `explode_numbers_outer` 与 `explode_numbers` 不同的是，会在表函数生成 0 行数据时添加一行`Null`数据。

## 语法
```sql
EXPLODE_NUMBERS(<n>)
EXPLODE_NUMBERS_OUTER(<n>)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `<n>` | 整数类型 |

## 返回值

返回一个 [0,n) 的序列

- 当为 0 或者 NULL 时不返回

## 举例

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers(5) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
|    0 |
|    1 |
|    2 |
|    3 |
|    4 |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers(0) tmp1 as e1;
Empty set
```

```sql
select e1 from (select 1 k1) as t lateral view explode_numbers_outer(0) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
+------+
```