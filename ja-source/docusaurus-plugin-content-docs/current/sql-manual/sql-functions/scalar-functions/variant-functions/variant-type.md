---
{
  "title": "VARIANT_TYPE",
  "language": "ja",
  "description": "VARIANTTYPE関数は、VARIANT値の実際の型を返します。"
}
---
## Function

`VARIANT_TYPE`関数は`VARIANT`値の実際の型を返します。  
この関数は通常、`VARIANT`データの構造をデバッグまたは分析するために使用され、型の判定とデータ処理を支援します。

## Syntax

```sql
VARIANT_TYPE(variant_value)
```
## パラメータ

- `variant_value`: `VARIANT`型の値。

## 戻り値

- `VARIANT`値の実際の型を表す文字列を返します。
    - 文字列は`{"key":"value"}`構造に従います。
    - keyはサブフィールドパスを表し、valueは型を表します。

## 注意事項

1. `VARIANT`カラムに格納されている実際の型を見つけるために使用されます。
2. テーブルの各行に対して、サブフィールドが読み取られて型が取得されます。実際の使用では、実行速度の低下を避けるため`LIMIT`を使用して行数を制限してください。

## 例

```SQL
CREATE TABLE variant_table(
    k INT,
    v VARIANT NULL
)
DUPLICATE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO variant_table VALUES(1, '{"a": 10, "b": 1.2, "c" : "ddddd"}'), (2, NULL);

SELECT VARIANT_TYPE(v) FROM variant_table;
+-------------------------------------------+
| VARIANT_TYPE(v)                           |
+-------------------------------------------+
| {"a":"tinyint","b":"double","c":"string"} |
| NULL                                      |
+-------------------------------------------+
```
