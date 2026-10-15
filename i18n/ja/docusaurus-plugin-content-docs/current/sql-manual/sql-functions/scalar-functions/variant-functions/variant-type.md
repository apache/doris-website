---
{
    "title": "VARIANT_TYPE",
    "language": "ja",
    "description": "VARIANT_TYPE は VARIANT 値の型名（object、array、string、bigint、double など）を返し、VARIANT データのデバッグや分析に役立ちます。"
}
---

## 関数

`VARIANT_TYPE` 関数は、`VARIANT` 値の型名を返します。
通常、`VARIANT` データの構造をデバッグまたは分析する際に使用し、型の判定やデータ処理に役立てます。このページでは、Doris 5.0.0 以降の動作を説明します。

## 構文

```sql
VARIANT_TYPE(variant_value)
```

## 引数

- `variant_value`: `VARIANT` 型の値。ネストされた値の型を取得するには、`VARIANT_TYPE(v['a'])` のようにパスを渡します。

## 戻り値

値自体の型名を `STRING` で返します。オブジェクトまたは配列の場合は `object` または `array` を返し、要素の型は列挙しません。

| 結果 | 値 |
| --- | --- |
| `object`, `array` | JSON オブジェクトまたは配列 |
| `string` | 文字列 |
| `bool` | `true` または `false` |
| `tinyint`, `smallint`, `int`, `bigint` | 値を格納できる最小の型で示される整数 |
| `decimal` | `BIGINT` の範囲を超える整数や、最大 38 桁の `LARGEINT` 値を含む十進数 |
| `float`, `double` | 浮動小数点数 |
| `date` | 日付 |
| `timestamp` | タイムゾーン付きのタイムスタンプ |
| `timestamp_ntz` | `DATETIME` または `TIMESTAMP_NS` 値など、タイムゾーンなしのタイムスタンプ |
| `null` | VARIANT の `null`（JSON の `null`） |
| `binary`, `time`, `uuid` | Doris の JSON 解析でも CAST でも生成されない値。Parquet ファイルなど、他のシステムが書き込んだ VARIANT データに由来する場合があります |

SQL の `NULL` を入力すると、SQL の `NULL` を返します。

## 注意事項

1. `VARIANT` カラムに含まれる値の実際の型を調べるために使用します。テーブルから読み取った値の場合、結果には格納された値が反映されます。たとえば、ルート値の `DATE` は文字列として格納されます。[格納時に保持される内容](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps)を参照してください。
2. 結果が示すのは値の型であり、パスの格納型ではありません。`BIGINT` パスから読み取った整数でも `tinyint` になる場合があります。テーブル内の各サブカラムの格納型を確認するには、`SET describe_extend_variant_column = true;` と `DESC` を使用します。
3. この関数はすべての行を読み取るため、実際の使用時には `LIMIT` で行数を制限してください。

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

INSERT INTO variant_table VALUES
    (1, PARSE_TO_VARIANT('{"a": 10, "b": 1.2, "c": "ddddd"}')),
    (2, PARSE_TO_VARIANT('[1, 2]')),
    (3, NULL);

SELECT k,
       VARIANT_TYPE(v)      AS root_type,
       VARIANT_TYPE(v['a']) AS a_type,
       VARIANT_TYPE(v['b']) AS b_type,
       VARIANT_TYPE(v['c']) AS c_type
FROM variant_table
ORDER BY k;
```

```text
+------+-----------+---------+--------+--------+
| k    | root_type | a_type  | b_type | c_type |
+------+-----------+---------+--------+--------+
|    1 | object    | tinyint | double | string |
|    2 | array     | NULL    | NULL   | NULL   |
|    3 | NULL      | NULL    | NULL   | NULL   |
+------+-----------+---------+--------+--------+
```
