---
{
    "title": "HAMMING_DISTANCE",
    "language": "ja",
    "description": "HAMMING_DISTANCE 関数は、文字数が同じ二つの文字列で異なる文字の位置の数を返します。"
}
---

::: note
4.1.2 以降
:::

## 説明

`HAMMING_DISTANCE` 関数は、二つの文字列で異なる文字の位置の数を返します。

この関数はバイト単位ではなく UTF-8 文字単位で文字列を比較します。入力する二つの文字列の UTF-8 文字数は同じである必要があります。比較では大文字と小文字を区別します。

## 構文

```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str1>` | 比較する一つ目の文字列。 |
| `<str2>` | 比較する二つ目の文字列。 |

## 戻り値

文字が異なる位置の数を表す BIGINT 値を返します。

特殊なケース:

- いずれかの引数が NULL の場合は、NULL を返します。
- 両方の引数が空文字列の場合は、0 を返します。
- 二つの文字列の UTF-8 文字数が異なる場合は、エラーを返します。

## 例

1. 文字数が同じ二つの ASCII 文字列を比較します。

```sql
SELECT hamming_distance('karolin', 'kathrin') AS distance;
```

```text
+----------+
| distance |
+----------+
|        3 |
+----------+
```

2. 二つの UTF-8 文字列を比較します。文字数は同じで、異なる文字は一つだけです。

```sql
SELECT hamming_distance('数据库', '数据仓') AS distance;
```

```text
+----------+
| distance |
+----------+
|        1 |
+----------+
```

3. 大文字と小文字だけが異なる文字列を比較します。

```sql
SELECT hamming_distance('Doris', 'doris') AS distance;
```

```text
+----------+
| distance |
+----------+
|        1 |
+----------+
```

4. NULL を入力すると NULL を返します。

```sql
SELECT hamming_distance(NULL, 'abc') AS distance;
```

```text
+----------+
| distance |
+----------+
|     NULL |
+----------+
```
