---
{
    "title": "BITMAP_FROM_STRING",
    "language": "ja",
    "description": "文字列を BITMAP に変換します。文字列は、カンマで区切られた無符号 BIGINT 値の集合です。"
}
---

## 説明

文字列を BITMAP に変換します。文字列は、カンマで区切られた無符号 BIGINT 値の集合です（各値の範囲は 0 ～ 18446744073709551615）。たとえば、文字列 "0, 1, 2" は、0 番目、1 番目、2 番目のビットが設定された BITMAP に変換されます。入力フィールドが無効な場合は NULL を返します。

## 構文

```sql
 BITMAP_FROM_STRING(<str>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<str>`   | カンマで区切った無符号 BIGINT 値の文字列。たとえば、文字列 "0, 1, 2" は、ビット 0、1、2 が設定された BITMAP に変換されます。 |

## 戻り値

BITMAP を返します。
- 入力が NULL または無効な場合、結果は NULL になります。

## 例

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```

```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```

```sql
select bitmap_to_string(bitmap_from_string("-1, 0, 1, 2")) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string(NULL)) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("18446744073709551616, 1")) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```

```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```

