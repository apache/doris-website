---
{
  "title": "HLL",
  "description": "HLLは近似重複排除に使用され、大量のデータを扱う際にCount Distinctよりも優れた性能を発揮します。",
  "language": "ja"
}
---
HLLは近似重複排除に使用され、大量のデータを扱う際にCount Distinctよりも優れた性能を発揮します。HLLの読み込みは、hll_hashなどの関数と組み合わせる必要があります。詳細なドキュメントについては、[HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL)を参照してください。

## 使用例

### ステップ1: データの準備

以下のCSVファイルを作成します: test_hll.csv

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```
### ステップ 2: データベースにTableを作成

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```
### ステップ3: データの読み込み

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```
### ステップ 4: 読み込まれたデータの確認

hll_cardinalityを使用してクエリを実行します：

```sql
mysql> select typ_id,typ_name,hll_cardinality(pv) from testdb.test_hll;
+--------+----------+---------------------+
| typ_id | typ_name | hll_cardinality(pv) |
+--------+----------+---------------------+
|   1010 | buag     |                   1 |
|   1002 | nijg     |                   1 |
|   1001 | koga     |                   1 |
|   1008 | nfubg    |                   1 |
|   1005 | jfin     |                   1 |
|   1009 | huang    |                   1 |
|   1004 | lofn     |                   1 |
|   1007 | nhga     |                   1 |
|   1003 | lojn     |                   1 |
|   1006 | kon      |                   1 |
+--------+----------+---------------------+
10 rows in set (0.06 sec)
