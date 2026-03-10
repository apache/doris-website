---
{
  "title": "グループ化",
  "language": "ja",
  "description": "GROUP BY リストの指定された列式が集約されているかどうかを示します。GROUPING は列が集約されている場合（すなわち、"
}
---
## 説明

GROUP BY リスト内の指定された列式が集約されているかどうかを示します。GROUPING は、列が集約されている場合（つまり、ROLLUP、CUBE、または GROUPING SETS によって生成された集計行から来ている場合）は 1 を返し、集約されていない場合は 0 を返します。この関数は、これらの操作によって生成された NULL 値を、データ内の実際の NULL 値と区別するのに役立ちます。

## 構文

```sql
GROUPING( <column_expression> )
```
## パラメータ

| パラメータ             | 説明                                                                  |
|-----------------------|-----------------------------------------------------------------------|
| `<column_expression>` | GROUP BY句に現れるカラムまたは式。               |

## 戻り値

BIGINT値を返します。この関数は、指定されたカラム式が集約されている場合は1を返し、集約されていない場合は0を返します。

## 例

次の例では、`camp`カラムをグループ化し、`occupation`のカウントを集約します。GROUPING関数を`camp`カラムに適用して、ROLLUP操作によって追加された集約行とデータ内の実際のNULL値を区別します。

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
結果セットでは、`camp`列の下に2つのNULL値が表示されています。グルーピング値が1の最初のNULLは、ROLLUP操作によって追加された要約行で、すべての`camp`グループの集計を表しています。グルーピング値が0の2番目のNULLは、データからの実際のNULL値を表しています。

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
