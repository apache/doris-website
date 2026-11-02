---
{
    "title": "MULTI_MATCH_ANY",
    "language": "ja",
    "description": "文字列が配列内のいずれかの正規表現に一致するかどうかを調べます。"
}
---

<a id="multi_match_any"></a>

## 説明 {#description}

`<haystack>` が `<patterns>` 内のいずれかの正規表現に一致するかどうかを調べます。デフォルトでは大文字と小文字を区別します。`0` が返され、`NULL` は返されないのは、いずれかの引数が `NULL` の場合です。

## 構文 {#syntax}

```sql
MULTI_MATCH_ANY(<haystack>, <patterns>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<haystack>` | 入力文字列。型は `STRING` です。 |
| `<patterns>` | 正規表現の配列。型は `ARRAY<STRING>` です。各パターン要素には NULL 以外の文字列を指定してください。 |

## 戻り値 {#return-value}

戻り値は `TINYINT` で、いずれかの式が一致すれば `1`、それ以外は `0` です。空のパターン配列でも `0` を返し、いずれかの引数が `NULL` の場合も同様です。

この関数は Hyperscan/VectorScan 正規表現エンジンを使用します。無効なパターンやサポートされていないパターンを指定するとエラーが発生します。定数の入力文字列と、非定数のパターン配列カラムを組み合わせることはできず、その組み合わせでは引数エラーが発生します。

## 例 {#example}

```sql
SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', ['A', 'bcd']) AS matched;
```

```text
0
```

正規表現は、文字列をそのまま部分文字列として検索するのではなく、パターンマッチングを行います。

```sql
SELECT multi_match_any('abc123', ['[0-9]+', '^xyz']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', CAST([] AS ARRAY<STRING>)) AS empty_patterns,
       multi_match_any(CAST(NULL AS STRING), ['a']) AS null_text,
       multi_match_any('abc', CAST(NULL AS ARRAY<STRING>)) AS null_patterns;
```

```text
0    0    0
```

## キーワード {#keywords}

MULTI_MATCH, MATCH, ANY
