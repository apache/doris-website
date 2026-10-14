---
{
    "title": "ARRAY_AGG",
    "language": "ja",
    "description": "列の値（NULL 値を含む）を集約して配列にします。行を列にピボットする際に使用できます。"
}
---

## 説明

列の値（NULL 値を含む）を集約して配列にします。行を列にピボットする際に使用できます。

## 構文

```sql
ARRAY_AGG(<col>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | 配列に格納する値を指定する式。対応する型: Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、TimestampNs、Timestamptz、IPV4、IPV6、UUID、String、Array、Map、Struct。 |

## 戻り値

ARRAY 型の値を返します。特殊なケース:

- 配列内の要素の順序は保証されません。
- 変換によって生成された配列を返します。配列の要素型は入力列の型と一致します。


## 例

```sql
-- setup
CREATE TABLE test_doris_array_agg (
	c1 INT,
	c2 INT
) DISTRIBUTED BY HASH(c1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_doris_array_agg VALUES (1, 10), (1, 20), (1, 30), (2, 100), (2, 200), (3, NULL);
```

```sql
select c1, array_agg(c2) from test_doris_array_agg group by c1;
```

```text
+------+---------------+
| c1   | array_agg(c2) |
+------+---------------+
|    1 | [10, 20, 30]  |
|    2 | [100, 200]    |
|    3 | [null]        |
+------+---------------+
```

```sql
select array_agg(c2) from test_doris_array_agg where c1 is null;
```

```text
+---------------+
| array_agg(c2) |
+---------------+
| []            |
+---------------+
```
