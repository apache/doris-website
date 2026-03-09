---
{
  "title": "HLL近似重複排除",
  "language": "ja",
  "description": "実際のビジネスシナリオにおいて、ビジネスデータの量が増加するにつれて、重複排除の負荷も増大する。"
}
---
# HLL近似重複除去

## 使用例

実際のビジネスシナリオでは、ビジネスデータのボリュームが増加するにつれて、重複除去の負荷も増大します。データが一定の規模に達すると、精密な重複除去のコストはますます高くなります。**HLL**（HyperLogLog）は、優れた空間計算量O(m⋅log⁡log⁡n)、時間計算量O(n)、そしてデータセットサイズと使用されるハッシュ関数に応じて1%～2%の制御されたエラー率で際立っています。

ビジネスで許容できる場合、高速重複除去に近似アルゴリズムを使用することは、計算負荷を軽減する効果的な方法です。

------

## HyperLogLogとは

HyperLogLog（HLL）はLogLogアルゴリズムの拡張版です。近似ユニークカウントに使用され、数学的に**ベルヌーイ試行**に基づいています。

### 説明：

表と裏のあるコインを投げることを想像してください。各投げには50%の確率でどちらかの面が出ます。表が出るまでコインを投げ続け、投げた回数を1回の試行として記録します。

複数のベルヌーイ試行において：

- nをn回の試行後に得られた表の数とします。
- kを各試行で必要な投げ回数とします。例えば、ある試行で表が出るまでに12回投げる必要があった場合、この試行セットのk_maxは12になります。

ベルヌーイ試行は以下の結論をもたらします：

1. n回の試行において、k_max回を超える投げが必要な試行は存在しません。
2. 少なくとも1つの試行で、正確にk_max回の投げが必要になります。

最尤推定を適用することで、以下が導出できます：

n = 2 ^ k_max

したがって、k_maxのみを記録することで、ユニークアイテムの総数（カーディナリティ）を推定できます。

------

## 近似重複除去でのHLL使用

### テーブルの作成

1. 重複除去でHLLを使用する場合：
   - 対象カラムタイプは`HLL`に設定する必要があります。
   - 集計関数は`HLL_UNION`に設定する必要があります。
2. HLL型カラムはキーカラムとして使用できません。
3. ユーザーは長さやデフォルト値を指定する必要はありません。システムはデータ集計レベルに基づいて内部的に長さを管理します。

テーブル作成例：

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
------

### データのインポート

Stream Loadを使用してインポートできるサンプルデータ（`test_hll.csv`）は以下の通りです：

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
**Stream Load コマンド**:

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
------

## データのクエリ

HLLカラムは直接生の値を返すことができません。代わりに、クエリにはHLL集約関数を使用する必要があります。

**総UV計算**：

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
## 関連関数

- **HLL_UNION_AGG(hll)**: 条件を満たすすべてのデータのカーディナリティを推定する集約関数。
- **HLL_CARDINALITY(hll)**: 単一のHLL列のカーディナリティを計算する関数。
- **HLL_HASH(column_name)**: HLL列タイプを生成し、挿入またはデータインポート時に使用される（上記のとおり）。
- **HLL_EMPTY()**: `INSERT`またはデータインポート時にデフォルト値として空のHLL列を生成する。
