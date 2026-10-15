---
{
    "title": "JSON_EACH",
    "language": "ja",
    "description": "最上位の JSON オブジェクトをキーと値のペアに展開します。値の列は JSON 型を保持します。LATERAL VIEW とともに使用する必要があります。"
}
---

## 説明 {#description}

`json_each` テーブル関数は、最上位の JSON オブジェクトをキーと値のペアに展開します。各行には一つのキー（`key`）と対応する値（`value`）が含まれます。`value` 列は JSON 型を保持するため、文字列値は JSON の引用符を含んだまま返されます。

[`LATERAL VIEW`](../../../query-data/lateral-view.md) とともに使用する必要があります。

## 構文 {#syntax}

```sql
JSON_EACH(<json_str>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| ---------- | ---- |
| `<json_str>` | 展開する JSON 文字列。内容は JSON オブジェクトである必要があります。 |

## 戻り値 {#return-value}

複数の列と行からなるデータを返します。各行は JSON オブジェクト内の一つのキーと値のペアに対応します。

| 列 | 型 | 説明 |
| --- | --- | ---- |
| `key` | String | JSON オブジェクトのキー名 |
| `value` | JSON | 対応する値。JSON 型のまま保持されます（文字列値には引用符が含まれます。例：`"foo"`）。 |

特殊なケース：
- `<json_str>` が NULL の場合、0 行を返します。
- `<json_str>` が空のオブジェクト（`{}`）の場合、0 行を返します。

## 例 {#examples}

基本的な使用方法：文字列値を含む JSON オブジェクトを展開する

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

> `value` 列は JSON 型であるため、文字列値には JSON の引用符が残ります。

複数の型の値を含む JSON オブジェクト

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"str":"hello","num":42,"bool":true,"null_val":null,"arr":[1,2]}') t AS k, v;
```

```text
+----------+---------+
| k        | v       |
+----------+---------+
| str      | "hello" |
| num      | 42      |
| bool     | true    |
| null_val | NULL    |
| arr      | [1,2]   |
+----------+---------+
```

NULL パラメータ：0 行を返す

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each(NULL) t AS k, v;
-- Empty set
```

空のオブジェクト：0 行を返す

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{}') t AS k, v;
-- Empty set
```
