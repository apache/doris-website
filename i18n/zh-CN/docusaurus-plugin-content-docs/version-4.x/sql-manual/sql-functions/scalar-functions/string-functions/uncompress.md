---
{
    "title": "UNCOMPRESS",
    "language": "zh-CN",
    "description": "UNCOMPRESS 函数用于将二进制数据解压缩成字符串或值，你需要确保二进制数据需要是COMPRESS的结果。"
}
---

## 描述
UNCOMPRESS 函数用于将二进制数据解压缩成字符串或值，你需要确保二进制数据需要是`COMPRESS`的结果。

## 语法

```sql
UNCOMPRESS(<compressed_str>)
```

## 参数

| 参数                | 说明            |
|--------------------|---------------|
| `<compressed_str>` | 压缩得到的二进制数据，参数类型是 varchar 或者 string |

## 返回值

返回值与输入的 `compressed_str` 类型一致

特殊情况：
- `compressed_str` 输入不是`COMPRESS`得到的二进制数据时，返回 NULL.


## 举例

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```
```sql
select uncompress(compress(''));
```
```text 
+--------------------------+
| uncompress(compress('')) |
+--------------------------+
|                          |
+--------------------------+
```
```sql
select uncompress(compress(abc));
```
```text 
+-------------------+
| uncompress('abc') |
+-------------------+
| NULL              |
+-------------------+
```