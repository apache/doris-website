---
{
  "title": "グループ化",
  "description": "GROUP BY リスト内の指定された列式が集約されているかどうかを示します。GROUPING は、列が集約されている場合（つまり、",
  "language": "ja"
}
---
## 説明

GROUP BY リスト内の指定された列式が集約されているかどうかを示します。GROUPING は、列が集約されている場合（つまり、ROLLUP、CUBE、または GROUPING SETS によって生成されたサマリー行から来ている場合）は 1 を返し、集約されていない場合は 0 を返します。この関数は、これらの操作によって生成された NULL 値とデータ内の実際の NULL 値を区別するのに役立ちます。

## 構文

```sql
GROUPING( <column_expression> )
```
## パラメータ

| Parameter             | デスクリプション                                                                  |
|-----------------------|------------------------------------------------------------------------------|
| `<column_expression>` | GROUP BY句に現れるカラムまたは式。               |

## Return Value

BIGINT値を返します。この関数は、指定されたカラム式が集約されている場合は1を、集約されていない場合は0を返します。

## Examples

次の例では、`camp`カラムをグループ化し、`occupation`の件数を集約しています。GROUPING関数を`camp`カラムに適用して、ROLLUP操作によって追加された集計行とデータ内の実際のNULL値を区別しています。

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
結果セットは`camp`列の下に2つのNULL値を示しています。グループ化値が1の最初のNULLは、すべての`camp`グループの集約を表すROLLUP操作によって追加された要約行です。グループ化値が0の2番目のNULLは、データからの実際のNULL値を表しています。

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
