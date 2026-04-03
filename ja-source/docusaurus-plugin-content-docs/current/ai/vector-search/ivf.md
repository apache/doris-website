---
{
  "title": "IVF",
  "language": "ja",
  "description": "IVFインデックスは、近似最近傍（ANN）検索に使用される効率的なデータ構造です。検索時にベクトルの範囲を絞り込むのに役立ちます。"
}
---
<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# IVFとApaceh Dorisでの使用方法

IVFインデックスは、Approximate Nearest Neighbor（ANN）検索で使用される効率的なデータ構造です。検索時にベクトルの範囲を絞り込むことで、検索速度を大幅に向上させます。Apache Doris 4.x以降、IVFベースのANNインデックスがサポートされています。このドキュメントでは、IVFアルゴリズム、主要なパラメータ、エンジニアリングの実践について説明し、本番環境のDorisクラスターでIVFベースのANNインデックスを構築・調整する方法を解説します。

## IVFインデックスとは？

完全を期すために、歴史的な背景を説明します。IVF（inverted file）という用語は、情報検索分野に由来します。

テキストドキュメントを使った簡単な例を考えてみましょう。特定の単語を含むドキュメントを検索する場合、**前方インデックス**は各ドキュメントの単語リストを保存します。関連するドキュメントを見つけるには、各ドキュメントを明示的に読む必要があります。

|ドキュメント|単語|
|---|---|
|Document 1|the,cow,says,moo|
|Document 2|the,cat,and,the,hat|
|Document 3|the,dish,ran,away,with,the,spoon|

これに対して、**転置インデックス**は検索可能なすべての単語の辞書を持ち、各単語について、その単語が出現するドキュメントインデックスのリストを持ちます。これが転置リスト（転置ファイル）であり、選択されたリストに検索を制限できます。

| 単語 | ドキュメント                                                  |
| ---- | ---------------------------------------------------------- |
| the  | Document 1, Document 3, Document 4, Document 5, Document 7 |
| cow  | Document 2, Document 3, Document 4                         |
| says | Document 5                                                 |
| moo  | Document 7                                                 |

現在、テキストデータはベクトル埋め込みとして表現されることが多くなっています。IVF手法はクラスター中心を定義し、これらの中心は前の例における単語辞書に類似しています。各クラスター中心について、そのクラスターに属するベクトルインデックスのリストを持ち、選択されたクラスターのみを調べるため検索が高速化されます。

## 効率的なベクトル検索のためのIVFインデックスの使用

データセットが数百万、さらには数十億のベクトルに成長すると、クエリとデータベース内のすべてのベクトル間の距離を計算する網羅的な厳密k最近傍（kNN）検索は、計算量の観点から現実的でなくなります。この総当たりアプローチは、大きな行列乗算に相当し、スケールしません。

幸い、多くのアプリケーションでは、わずかな精度と引き換えに速度の大幅な向上を実現できます。これがApproximate Nearest Neighbor（ANN）検索の領域であり、Inverted File（IVF）インデックスは最も広く使用され効果的なANN手法の一つです。

IVFの基本原理は「分割統治」です。データセット全体を検索する代わりに、IVFは検索範囲を有望な少数の領域に知的に絞り込み、必要な比較回数を大幅に削減します。

IVFは、大きなベクトルデータセットをより小さく管理しやすいクラスターに分割し、各クラスターを「重心」と呼ばれる中心点で表現することで動作します。これらの重心は、それぞれのパーティションのアンカーとして機能します。検索中、システムは重心がクエリベクトルに最も近いクラスターを素早く特定し、それらの中のみを検索し、データセットの残りの部分は無視します。

![ivf search](/images/vector-search/dataset-points-query-clusters.png)

## Apache DorisにおけるIVF

Apache Dorisは、バージョン4.x以降でIVFベースのANNインデックスの構築をサポートしています。

### インデックス構築

ここで使用するインデックスタイプはANNです。ANNインデックスを作成する方法は2つあります：テーブル作成時に定義する方法と、`CREATE/BUILD INDEX`構文を使用する方法です。この2つのアプローチは、インデックスの構築方法とタイミングが異なるため、異なるシナリオに適しています。

アプローチ1：テーブル作成時にベクトル列にANNインデックスを定義します。データが読み込まれると、セグメントが作成される際にANNインデックスが構築されます。利点は、データ読み込みが完了すると、インデックスがすでに構築されているため、クエリが即座に高速化に利用できることです。欠点は、同期的なインデックス構築によってデータ取り込みが遅くなり、コンパクション中にインデックスの再構築が発生する可能性があり、リソースの無駄につながることです。

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="ivf",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```
#### CREATE/BUILD INDEX

アプローチ2: `CREATE/BUILD INDEX`。

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT ""
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```
データがロードされた後、`CREATE INDEX`を実行できます。この時点でインデックスはテーブル上で定義されますが、既存のデータに対してはまだインデックスは構築されていません。

```sql
CREATE INDEX idx_test_ann ON sift_1M (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="l2_distance",
  "dim"="128",
  "nlist"="1024"
);

SHOW DATA ALL FROM sift_1M;

mysql> SHOW DATA ALL FROM sift_1M;
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
```
その後、`BUILD INDEX`文を使用してインデックスを構築できます：

```sql
BUILD INDEX idx_test_ann ON sift_1M;
```
`BUILD INDEX`は非同期で実行されます。`SHOW BUILD INDEX`（一部のバージョンでは`SHOW ALTER`）を使用してジョブステータスを確認できます。

```sql
SHOW BUILD INDEX WHERE TableName = "sift_1M";

mysql> SHOW BUILD INDEX WHERE TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764392359610 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 14:18:22.360 | 2025-12-01 14:18:27.885 | 5036          | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)

mysql> SHOW DATA ALL FROM sift_1M;
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
2 rows in set (0.00 sec)
```
#### DROP INDEX

`ALTER TABLE sift_1M DROP INDEX idx_test_ann`で不適切なANNインデックスを削除できます。インデックスの削除と再作成は、ハイパーパラメータ調整時に異なるパラメータ組み合わせをテストして望ましいrecallを実現する必要がある場合によく行われます。


### Querying

ANNインデックスはTop‑N検索とrange検索の両方をサポートします。

ベクトル列が高次元の場合、クエリベクトル自体のリテラル表現により追加の解析オーバーヘッドが発生する可能性があります。そのため、本番環境、特に高い並行性の下では、完全なクエリベクトルを生のSQLに直接埋め込むことは推奨されません。より良い手法は、繰り返しのSQL解析を避けるprepared statementsを使用することです。

[doris-vector-search](https://github.com/uchenily/doris_vector_search) pythonライブラリの使用を推奨します。このライブラリはprepared statementsに基づいてDorisでのベクトル検索に必要な操作をラップし、Dorisクエリ結果をPandas `DataFrame`にマッピングするデータ変換ユーティリティを含んでおり、下流のAIアプリケーション開発を便利にします。

```python
from doris_vector_search import DorisVectorClient, AuthOptions

auth = AuthOptions(
    host="127.0.0.1",
    query_port=9030,
    user="root",
    password="",
)

client = DorisVectorClient(database="test", auth_options=auth)

tbl = client.open_table("sift_1M")

query = [0.1] * 128  # Example 128-dimensional vector

# SELECT id FROM sift_1M ORDER BY l2_distance_approximate(embedding, query) LIMIT 10;
result = tbl.search(query, metric_type="l2_distance").limit(10).select(["id"]).to_pandas()

print(result)
```
サンプル出力:

```text
       id
0  123911
1  926855
2  123739
3   73311
4  124493
5  153178
6  126138
7  123740
8  125741
9  124048
```
### Recall最適化


ベクトル検索において、recallは最も重要な指標です。パフォーマンス数値は、特定のrecallレベルの下でのみ意味を持ちます。recallに影響する主な要因は以下の通りです：

1. IVFのインデックス時パラメータ（`nlist`）とクエリ時パラメータ（`nprobe`）
2. ベクトル量子化
3. セグメントサイズとセグメント数

本記事では、(1)と(3)がrecallに与える影響に焦点を当てます。ベクトル量子化については別文書で取り扱います。


#### インデックスハイパーパラメータ

IVFインデックスは、ベクトルを複数のクラスタに整理します。インデックス構築時、ベクトルはクラスタリングを使用してグループに分割されます。検索プロセスは、最も関連性の高いクラスタのみに焦点を当てます。ワークフローは概ね以下の通りです：

インデックス時：

1. **クラスタリング**：全てのベクトルは、クラスタリングアルゴリズム（例：k‑means）を使用して`nlist`個のクラスタに分割されます。各クラスタの重心が計算され、保存されます。
2. **ベクトル割り当て**：各ベクトルは、重心が最も近いクラスタに割り当てられ、そのクラスタの転置リストに追加されます。

クエリ時：

1. **nprobeを使用したクラスタ選択**：クエリベクトルに対して、全ての`nlist`個の重心への距離が計算されます。検索対象として、最も近い`nprobe`個のクラスタのみが選択されます。
2. **選択されたクラスタ内での全数検索**：最近傍を見つけるため、選択されたnprobe個のクラスタ内の全てのベクトルとクエリが比較されます。

要約：

`nlist`はクラスタ数（転置リスト数）を定義します。これはrecall、メモリオーバーヘッド、構築時間に影響します。より大きな`nlist`は、より細かい粒度のクラスタを作成し、クエリの最近傍が適切に局所化されている場合は検索速度を向上させることができますが、クラスタリングのコストと近傍が複数のクラスタに分散するリスクも増加させます。

`nprobe`はクエリ中に検索するクラスタ数を定義します。より大きな`nprobe`はrecallとクエリレイテンシを増加させます（より多くのベクトルが調査されるため）。より小さなnprobeはクエリを高速化しますが、探査されていないクラスタに存在する近傍を見逃す可能性があります。


デフォルトでは、Dorisは`nlist = 1024`と`nprobe = 64`を使用します。


上記は、これら2つのハイパーパラメータの定性的分析です。以下の表は、SIFT_1Mデータセットでの実証結果を示しています：


| nlist | nprobe | recall_at_100 |
| ----- | ------ | ------------- |
| 1024  | 64     | 0.9542        |
| 1024  | 32     | 0.9034        |
| 1024  | 16     | 0.8299        |
| 1024  | 8      | 0.7337        |
| 512   | 32     | 0.9384        |
| 512   | 16     | 0.8763        |
| 512   | 8      | 0.7869        |


事前に単一の最適な設定を提供することは困難ですが、ハイパーパラメータ選択のための実用的なワークフローに従うことができます：

1. インデックスなしでテーブル`table_multi_index`を作成します。2つまたは3つのベクトル列を含めることができます。
2. Stream Loadまたは他の取り込み方法を使用して、`table_multi_index`にデータをロードします。
3. `CREATE INDEX`と`BUILD INDEX`を使用して、全てのベクトル列にANNインデックスを構築します。
4. 異なる列で異なるインデックスパラメータ設定を使用します。インデックス構築が完了した後、各列でrecallを計算し、最適なパラメータ組み合わせを選択します。

例：

```bash
ALTER TABLE tbl DROP INDEX idx_embedding;
CREATE INDEX idx_embedding ON tbl (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="inner_product",
  "dim"="768",
  "nlist"="1024"
);
BUILD INDEX idx_embedding ON tbl;
```
#### インデックスごとのカバー対象行数


Dorisは内部的にデータを複数の層で整理しています。

- 最上位には**テーブル**があり、これは分散キーを使用してN個の**tablet**に分割されます。tabletはデータのシャーディング、再配置、リバランスの単位として機能します。
- 各データ取り込みまたはcompactionにより、tablet配下に新しい**rowset**が生成されます。rowsetはバージョン管理されたデータのコレクションです。
- rowset内のデータは実際には**segment**ファイルに格納されます。

inverted indexと同様に、vector indexは**segment**レベルで構築されます。segmentのサイズは`write_buffer_size`や`vertical_compaction_max_segment_size`などのBE設定オプションによって決定されます。取り込みおよびcompaction中に、メモリ内のmemtableが一定のサイズに達すると、segmentファイルとしてディスクにフラッシュされ、そのsegmentに対してvector index（または複数のvectorカラムに対する複数のindex）が構築されます。indexはそのsegment内の行のみをカバーします。

固定されたIVFパラメータセットが与えられた場合、indexが高いrecallを維持できるvector数には常に限界があります。segment内のvector数がその限界を超えると、recallが低下し始めます。



> `SHOW TABLETS FROM table`を使用してテーブルのcompaction状況を確認できます。対応するURLをたどることで、segmentの数を確認できます。

#### CompactionがRecallに与える影響

Compactionはより大きなsegmentを作成する可能性があるため、recallに影響を与えることがあります。これにより、元のhyperparameterが示す「カバー容量」を超える可能性があります。その結果、compaction前に達成されていたrecallレベルが、compaction後には維持されない場合があります。

`BUILD INDEX`を実行する前に、フルcompactionをトリガーすることを推奨します。完全にcompactionされたsegment上でindexを構築することで、recallが安定し、indexの再構築によるwrite amplificationも削減されます。

### クエリパフォーマンス

#### Indexファイルのコールドローディング

DorisのIVF ANN indexは、Metaのオープンソースライブラリ[Faiss](https://github.com/facebookresearch/faiss)を使用して実装されています。IVF indexはメモリにロードされた後に効果を発揮します。そのため、高並行性ワークロードを実行する前に、関連するすべてのsegment indexがメモリにロードされることを確認するために、いくつかのウォームアップクエリを実行することを推奨します。そうでなければ、ディスクI/Oオーバーヘッドがクエリパフォーマンスを大幅に悪化させる可能性があります。

#### メモリフットプリント vs パフォーマンス

量子化や圧縮を行わない場合、IVF indexのメモリフットプリントは、indexが対象とするすべてのvectorのメモリフットプリントの約1.02-1.1倍です。

例えば、100万個の128次元vectorの場合、IVF-FLAT indexには約以下が必要です：

`128 * 4 * 1,000,000 * 1.02 ≈ 500 MB`

参考値：

| dim | rows | estimated memory |
|-----|------|------------------|
| 128 | 1M   | 496 MB           |
| 768 | 1M   | 2.9 GB           |

安定したパフォーマンスを維持するため、各BEに十分なメモリがあることを確認してください。そうでなければ、頻繁なスワッピングとindexファイルのI/Oがクエリレイテンシを深刻に悪化させます。

### Benchmark

benchmarkを実行する際、デプロイメントモデルは本番環境のセットアップに従い、FEとBEを分離してデプロイし、クライアントは別の独立したマシンで実行する必要があります。

benchmarkフレームワークとして[VectorDBBench](https://github.com/zilliztech/VectorDBBench)を使用できます。

#### Performance768D1M

Benchmarkコマンド：

```bash
# load
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --skip-search-serial --skip-search-concurrent

# search
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --search-concurrent --search-serial --num-concurrency 10,40,80 --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --session-var ivf_nprobe=64 --skip-load --skip-drop-old
```
