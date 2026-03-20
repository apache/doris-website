---
{
  "title": "HLL_TO_BASE64",
  "description": "入力HLLをbase64エンコードされた文字列に変換します。",
  "language": "ja"
}
---
## 説明

入力されたHLLをbase64エンコードされた文字列に変換します。

## 構文

```sql
HLL_TO_BASE64(<hll_input>)
```
## パラメータ

| Parameter    | デスクリプション                                          |
| ------------ | ---------------------------------------------------- |
| `<hll_input>` | base64エンコード文字列に変換するHyperLogLog（HLL）データ。 |

## Return Value

HLLのBase64エンコード文字列。
HLLが`NULL`の場合は`NULL`を返します。

::: note

HLL内の要素の順序が保証されないため、同じ内容であっても生成されるBase64文字列は常に同じになるとは限りません。ただし、`hll_from_base64`でデコードされたHLLは同じになります。

:::

## Examples

```sql
select hll_to_base64(NULL);
```
```text
+---------------------+
| hll_to_base64(NULL) |
+---------------------+
| NULL                |
+---------------------+
```
```sql
select hll_to_base64(hll_empty());
```
```text
+----------------------------+
| hll_to_base64(hll_empty()) |
+----------------------------+
| AA==                       |
+----------------------------+
```
```sql
select hll_to_base64(hll_hash('abc'));
```
```text
+--------------------------------+
| hll_to_base64(hll_hash('abc')) |
+--------------------------------+
| AQEC5XSzrpDsdw==               |
+--------------------------------+
```
```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```
```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```
```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```
```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```
