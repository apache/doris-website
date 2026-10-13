---
{
    "title": "GROUPING",
    "language": "ja",
    "description": "指定した GROUP BY の列式が集約されているかを示します。集約されている場合、GROUPING は 1 を返します。"
}
---

## 説明

指定した GROUP BY の列式が集約されているかを示します。ROLLUP、CUBE、GROUPING SETS によって生成された集計行の列なら 1、集約されていない列なら 0 を返します。これらの操作が生成した NULL と、データ内の実際の NULL を区別するために使用します。

## 構文

```sql
GROUPING( <column_expression> )
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<column_expression>` | GROUP BY 句に含まれる列または式。 |

## 戻り値

BIGINT 値を返します。指定した列式が集約されている場合は 1、集約されていない場合は 0 を返します。

## 例

次の例では `camp` 列でグループ化し、`occupation` の件数を集計します。`camp` 列に GROUPING 関数を適用し、ROLLUP で追加された集計行とデータ内の実際の NULL 値を区別します。

```sql
CREATE TABLE `roles` (
  role_id       INT,
  occupation    VARCHAR(32),
  camp          VARCHAR(32),
  register_time DATE
)
UNIQUE KEY(role_id)
DISTRIBUTED BY HASH(role_id) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO `roles` VALUES
(0, 'who am I', NULL, NULL),
(1, 'mage', 'alliance', '2018-12-03 16:11:28'),
(2, 'paladin', 'alliance', '2018-11-30 16:11:28'),
(3, 'rogue', 'horde', '2018-12-01 16:11:28'),
(4, 'priest', 'alliance', '2018-12-02 16:11:28'),
(5, 'shaman', 'horde', NULL),
(6, 'warrior', 'alliance', NULL),
(7, 'warlock', 'horde', '2018-12-04 16:11:28'),
(8, 'hunter', 'horde', NULL);

SELECT 
  camp, 
  COUNT(occupation) AS occ_cnt,
  GROUPING(camp) AS grouping
FROM
  `roles`
GROUP BY
  ROLLUP(camp);
```

結果の `camp` 列には二つの NULL 値が表示されます。GROUPING 値が 1 の最初の NULL は、すべての `camp` グループを集計した ROLLUP の集計行です。GROUPING 値が 0 の次の NULL は、データ内の実際の NULL 値です。

```text
+----------+---------+----------+
| camp     | occ_cnt | grouping |
+----------+---------+----------+
| NULL     |       9 |        1 |
| NULL     |       1 |        0 |
| alliance |       4 |        0 |
| horde    |       4 |        0 |
+----------+---------+----------+
```
