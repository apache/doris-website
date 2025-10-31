---
{
    "title": "COMPRESS",
    "language": "zh-CN"
}
---

## 描述
COMPRESS 函数用于将字符串或值压缩成二进制数据，压缩后的数据可通过 `UNCOMPRESS` 函数解压还原。

## 语法

```sql
COMPRESS(<uncompressed_str>)
```

## 参数

| 参数                | 说明            |
|--------------------|---------------|
| `<uncompressed_str>` | 未压缩的原串，参数类型是 varchar 或者 string   |

## 返回值

返回串与输入的 `uncompressed_str` 类型一致  

返回串是不可读的压缩字节流。  

特殊情况：
- `uncompressed_str` 输入为 empty string(`''`) 时，返回 empty string(`''`)

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
select compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
|              |
+--------------+
```