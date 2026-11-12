---
{
    "title": "NGRAM_SEARCH",
    "language": "ja",
    "description": "NGRAM_SEARCH 関数は、文字列間の N-gram 類似度を計算します。類似度は 0 から 1 の範囲で、値が大きいほど文字列が似ていることを示します。"
}
---

## 説明 {#description}

NGRAM_SEARCH 関数は、文字列間の N-gram 類似度を計算します。類似度は 0 から 1 の範囲で、値が大きいほど文字列が似ていることを示します。

N-gram は、文字列を連続する N 文字の集合に分解します。類似度の計算式は `2 * |intersection| / (|set1| + |set2|)` です。

ASCII 文字のみをサポートします。

## 構文 {#syntax}

```sql
NGRAM_SEARCH(<text>, <pattern>, <gram_num>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| ------------ | ----------------------------------------- |
| `<text>` | 比較するテキスト文字列。型: VARCHAR |
| `<pattern>` | パターン文字列（定数である必要があります）。型: VARCHAR |
| `<gram_num>` | N-gram の N の値。正の整数定数である必要があります。型: INT。 |

## 戻り値 {#return-value}

文字列間の N-gram 類似度（0 から 1）を DOUBLE 型で返します。

特殊なケース:
- `<text>` または `<pattern>` が NULL の場合は NULL を返します。`<gram_num>` は正の整数定数である必要があり、NULL にはできません
- 文字列の長さが `<gram_num>` より短い場合は 0 を返します
- `<pattern>` と `<gram_num>` は定数である必要があります。Doris 4.1 系列の 4.1.5 以降では、0、負の数、整数以外の定数など、無効な `<gram_num>` の値を指定すると明示的にエラーが報告されます
- 類似度が 1 でも、文字列が完全に同一であるとは限りません

<a id="examples"></a>

## 例 {#example}

1. 基本的な使用方法: 類似度を計算する
```sql
SELECT ngram_search('123456789', '12345', 3);
```
```text
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+
```

2. 類似度が高い例
```sql
SELECT ngram_search('abababab', 'babababa', 2);
```
```text
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

3. 文字列が短すぎる場合は 0 を返す
```sql
SELECT ngram_search('ab', 'abc', 3);
```
```text
+----------------------------------+
| ngram_search('ab', 'abc', 3)     |
+----------------------------------+
|                                0 |
+----------------------------------+
```

4. NULL 値の扱い
```sql
SELECT ngram_search(NULL, 'test', 2);
```
```text
+--------------------------------+
| ngram_search(NULL, 'test', 2)  |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

無効な gram_num を指定するとエラーが報告されます:

```sql
SELECT NGRAM_SEARCH('abc', 'abc', 0);
```

```text
ngram_search(text,pattern,gram_num): gram_num must be a positive constant.
```

### キーワード {#keywords}

    NGRAM_SEARCH,NGRAM,SEARCH
