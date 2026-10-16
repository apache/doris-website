---
{
    "title": "VARIANT_TYPE",
    "language": "ja",
    "description": "VARIANT 値の実際の型を返します。"
}
---

## 説明

`VARIANT_TYPE` 関数は `VARIANT` 値の実際の型を返します。  
通常は `VARIANT` データのデバッグや構造分析に使用し、型の判定とデータ処理に役立てます。

## 構文

```sql
VARIANT_TYPE(variant_value)
```

## パラメータ

- `variant_value`: `VARIANT` 型の値です。

## 戻り値

- `VARIANT` 値の実際の型を表す文字列を返します。
    - 文字列は `{"key":"value"}` の構造に従います。
    - キーはサブフィールドのパス、値は型を表します。

## 注意事項

1. `VARIANT` 列に格納されている実際の型を調べるために使用します。  
2. テーブルの各行についてサブフィールドを読み取り、型を取得します。実際には実行が遅くならないよう、`LIMIT` で行数を制限してください。

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
