---
{
    "title": "JSON_EACH_TEXT",
    "language": "ja",
    "description": "最上位の JSON オブジェクトをキーと値の組に展開し、値の列をプレーンテキストとして返します。LATERAL VIEW と組み合わせて使用する必要があります。"
}
---

## 説明

`json_each_text` テーブル関数は、最上位の JSON オブジェクトをキーと値の組に展開します。各行には、キー（`key`）と対応する値（`value`）が含まれます。[`json_each`](json-each.md) とは異なり、`value` 列の型は TEXT であるため、文字列の値は JSON の引用符**なしで**返されます。

[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用する必要があります。

## 構文

```sql
JSON_EACH_TEXT(<json_str>)
```

## パラメータ

| パラメータ    | 説明                                          |
| ------------ | ---------------------------------------------------- |
| `<json_str>` | 展開する JSON 文字列。内容は JSON オブジェクトである必要があります。 |

## 戻り値

複数の列と行からなるデータを返します。各行は JSON オブジェクト内の一つのキーと値の組に対応します。

| 列  | 型 | 説明                                                                          |
|---------|------|--------------------------------------------------------------------------------------|
| `key`   | TEXT | JSON オブジェクト内のキー名                                                     |
| `value` | TEXT | プレーンテキストとして表した対応する値（文字列の値には引用符が付きません。例：`foo`） |

特殊なケース：
- `<json_str>` が NULL の場合、0 行を返します
- `<json_str>` が空のオブジェクト（`{}`）の場合、0 行を返します
- JSON の `null` 値は SQL の `NULL` として返します

## 例

基本的な使用方法：文字列の値を持つ JSON オブジェクトを展開する

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> `value` 列の型は TEXT であるため、文字列の値には（`json_each` とは異なり）JSON の引用符が**付きません**。

さまざまな型の値を持つ JSON オブジェクト

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"str":"hello","num":42,"bool":true,"null_val":null}') t AS k, v;
```

```text
+----------+-------+
| k        | v     |
+----------+-------+
| str      | hello |
| num      | 42    |
| bool     | true  |
| null_val | NULL  |
+----------+-------+
```

> JSON の `null` 値は SQL の `NULL` に変換されます。

NULL 引数：0 行を返す

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text(NULL) t AS k, v;
-- Empty set
```

空のオブジェクト：0 行を返す

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{}') t AS k, v;
-- Empty set
```
