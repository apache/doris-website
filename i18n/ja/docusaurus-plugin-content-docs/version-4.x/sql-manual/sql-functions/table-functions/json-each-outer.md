---
{
    "title": "JSON_EACH_OUTER",
    "language": "ja",
    "description": "JSON オブジェクトの最上位階層をキーと値の組に展開し、値の列は JSON 型を保持します。json_each とは異なり、入力が NULL または空のオブジェクトの場合は、0 行ではなく NULL 値を含む 1 行を返します。LATERAL VIEW と組み合わせて使用する必要があります。"
}
---

## 説明

`json_each_outer` テーブル関数は、JSON オブジェクトの最上位階層をキーと値の組に展開します。各行には、一つのキー（`key`）とそれに対応する値（`value`）が含まれます。`value` 列は JSON 型を保持するため、文字列の値は JSON の引用符を含んだまま返されます。

[`json_each`](json-each.md) とは異なり、入力が NULL または空のオブジェクトの場合、`json_each_outer` は 0 行ではなく `NULL, NULL` の一行を返します。

[`LATERAL VIEW`](../../../query-data/lateral-view.md) と組み合わせて使用する必要があります。

## 構文

```sql
JSON_EACH_OUTER(<json_str>)
```

## 引数

| 引数         | 説明                                             |
| ------------ | ------------------------------------------------ |
| `<json_str>` | 展開する JSON 文字列。内容は JSON オブジェクトである必要があります。 |

## 戻り値

複数列、複数行のデータを返します。各行は JSON オブジェクト内の一つのキーと値の組に対応します。

| 列      | 型     | 説明                                                        |
| ------- | ------ | ----------------------------------------------------------- |
| `key`   | String | JSON オブジェクト内のキー名                                  |
| `value` | JSON   | JSON 型を保持した対応する値（文字列の値には引用符が含まれます。例：`"foo"`） |

特殊なケース：
- `<json_str>` が NULL の場合、`NULL, NULL` の 1 行を返します。
- `<json_str>` が空のオブジェクト（`{}`）の場合、`NULL, NULL` の 1 行を返します。

## 例

基本的な使い方：文字列の値を持つ JSON オブジェクトを展開します。

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

NULL 引数：NULL の 1 行を返します。

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer(NULL) t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```

空のオブジェクト：NULL の 1 行を返します。

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
