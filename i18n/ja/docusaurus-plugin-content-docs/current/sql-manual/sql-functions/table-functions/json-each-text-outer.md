---
{
    "title": "JSON_EACH_TEXT_OUTER",
    "language": "ja",
    "description": "最上位の JSON オブジェクトをキーと値のペアに展開し、値の列をプレーンテキストで返します。json_each_text とは異なり、入力が NULL または空のオブジェクトの場合、0 行ではなく NULL を含む一行を返します。LATERAL VIEW とともに使用する必要があります。"
}
---

## 説明

`json_each_text_outer` テーブル関数は、最上位の JSON オブジェクトをキーと値のペアに展開します。各行には、一つのキー（`key`）と対応する値（`value`）が含まれます。[`json_each_outer`](json-each-outer.md) とは異なり、`value` 列の型は TEXT であるため、文字列値は JSON の引用符を**付けずに**返されます。

[`json_each_text`](json-each-text.md) とは異なり、入力が NULL または空のオブジェクトの場合、`json_each_text_outer` は 0 行ではなく `NULL, NULL` の一行を返します。

[`LATERAL VIEW`](../../../query-data/lateral-view.md) とともに使用する必要があります。

## 構文

```sql
JSON_EACH_TEXT_OUTER(<json_str>)
```

## パラメータ

| パラメータ   | 説明                                                          |
| ------------ | ------------------------------------------------------------- |
| `<json_str>` | 展開する JSON 文字列。内容は JSON オブジェクトである必要があります。 |

## 戻り値

複数の列と行からなるデータを返します。各行は JSON オブジェクト内の一つのキーと値のペアに対応します。

| 列      | 型   | 説明                                                                             |
| ------- | ---- | -------------------------------------------------------------------------------- |
| `key`   | TEXT | JSON オブジェクトのキー名                                                        |
| `value` | TEXT | 対応する値をプレーンテキストで返します（文字列値には引用符が付きません。例：`foo`）。 |

特殊なケース：
- `<json_str>` が NULL の場合、`NULL, NULL` の 1 行を返します。
- `<json_str>` が空のオブジェクト（`{}`）の場合、`NULL, NULL` の 1 行を返します。
- JSON の `null` 値は SQL の `NULL` として返されます。

## 使用例

基本的な使用方法：文字列値を持つ JSON オブジェクトを展開する

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> `value` 列の型は TEXT であるため、文字列値には JSON の引用符が**付きません**（`json_each_outer` とは異なります）。

NULL パラメータ：NULL を含む 1 行を返す

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer(NULL) t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```

空のオブジェクト：NULL を含む 1 行を返す

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
