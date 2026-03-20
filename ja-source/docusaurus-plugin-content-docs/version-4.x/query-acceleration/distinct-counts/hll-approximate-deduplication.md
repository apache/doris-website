---
{
  "title": "HLL近似重複除去",
  "description": "実際のビジネスシナリオでは、ビジネスデータの量が増加するにつれて、重複排除の負荷も増加します。",
  "language": "ja"
}
---
# HLL近似重複除去

## 使用例

実際のビジネスシナリオにおいて、ビジネスデータの量が増加するにつれて、重複除去の負荷も増加します。データが一定の規模に達すると、精密な重複除去のコストがますます高くなります。**HLL**（HyperLogLog）は、優れた空間計算量O(m⋅log⁡log⁡n)、時間計算量O(n)、そしてデータセットサイズと使用されるハッシュ関数に応じて1%〜2%に制御されたエラー率で優れた性能を発揮します。

ビジネス上許容できる場合、高速重複除去のために近似アルゴリズムを使用することは、計算負荷を軽減する効果的な方法です。

------

## HyperLogLogとは

HyperLogLog（HLL）は、LogLogアルゴリズムの改良版です。近似重複カウントに使用され、数学的に**ベルヌーイ試行**に基づいています。

### 説明：

表と裏のあるコインを投げることを想像してください。各投げには50%の確率でどちらかの面に着地します。表が出るまでコインを投げ続け、投げた回数を1回の試行として記録します。

複数のベルヌーイ試行について：

- nをn回の試行後に得られた表の数とする。
- kを各試行で必要な投げ回数とする。例えば、ある試行で表が出るまでに12回投げる必要があった場合、この試行セットのk_maxは12となる。

ベルヌーイ試行は以下の結論を導きます：

1. n回の試行において、k_maxより多い投げを必要とする試行はない。
2. 少なくとも1回の試行でちょうどk_max回の投げが必要となる。

最尤推定法を適用することで、以下が導出できます：

n = 2 ^ k_max

したがって、k_maxのみを記録することで、ユニークアイテムの総数（基数）を推定できます。

------

## 近似重複除去でのHLLの使用

### tableの作成

1. 重複除去でHLLを使用する場合：
   - 対象列の型を`HLL`に設定する必要があります。
   - 集約関数を`HLL_UNION`に設定する必要があります。
2. HLL型の列はキー列として使用できません。
3. ユーザーは長さやデフォルト値を指定する必要はありません。システムがデータ集約レベルに基づいて内部的に長さを管理します。

table作成例：

```sql
CREATE TABLE test_hll(
        dt DATE,
        id INT,
        name CHAR(10),
        province CHAR(10),
        os CHAR(10),
        uv HLL HLL_UNION
)
AGGREGATE KEY (dt, id, name, province, os)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES(
        "replication_num" = "1",
        "in_memory"="false"
);
```
### データのインポート

以下は、Stream Loadを使用してインポートできるサンプルデータ（`test_hll.csv`）です：

```csv
2022-05-05,10001,Test 01,Beijing,windows 
2022-05-05,10002,Test 01,Beijing,linux 
2022-05-05,10003,Test 01,Beijing,macos 
2022-05-05,10004,Test 01,Hebei,windows 
2022-05-06,10001,Test 01,Shanghai,windows 
2022-05-06,10002,Test 01,Shanghai,linux 
2022-05-06,10003,Test 01,Jiangsu,macos 
2022-05-06,10004,Test 01,Shaanxi,windows
```
**Stream Load Command**:

```bash
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```
**結果**:

```json
{
    "TxnId": 693,
    "Label": "label_test_hll_load",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 8,
    "NumberLoadedRows": 8,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 320,
    "LoadTimeMs": 23,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9,
    "CommitAndPublishTimeMs": 11
}
```
## データのクエリ

HLLカラムは直接生の値を返すことができません。代わりに、クエリにはHLL集約関数を使用する必要があります。

**合計UV計算**：

```sql
SELECT HLL_UNION_AGG(uv) FROM test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
```
以下と同等:

```sql
SELECT COUNT(DISTINCT id) FROM test_hll;
+----------------------+
| count(DISTINCT `id`) |
+----------------------+
|                    4 |
+----------------------+
```
**日次UV計算**:

```sql
SELECT dt, HLL_UNION_AGG(uv) FROM test_hll GROUP BY dt;
+------------+---------------------+
| dt         | hll_union_agg       |
+------------+---------------------+
| 2022-05-05 |                   4 |
| 2022-05-06 |                   4 |
+------------+---------------------+
```
## 関連する関数

- **HLL_UNION_AGG(hll)**: 条件を満たすすべてのデータのカーディナリティを推定する集約関数。
- **HLL_CARDINALITY(hll)**: 単一のHLL列のカーディナリティを計算する関数。
- **HLL_HASH(column_name)**: HLL列型を生成し、挿入またはデータインポート時に使用される（上記で示したとおり）。
- **HLL_EMPTY()**: `INSERT`またはデータインポート時のデフォルト値として空のHLL列を生成する。
