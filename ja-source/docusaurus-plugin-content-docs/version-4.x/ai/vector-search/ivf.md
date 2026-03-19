---
{
  "title": "IVF",
  "description": "IVFインデックスは、Approximate Nearest Neighbor (ANN) 検索に使用される効率的なデータ構造です。検索時にベクトルの範囲を絞り込むのに役立ちます。",
  "language": "ja"
}
---
# IVF と Apache Doris での使用方法

IVF index は、近似最近傍（ANN）検索に使用される効率的なデータ構造です。検索時にベクトルの範囲を絞り込むことで、検索速度を大幅に向上させます。Apache Doris 4.x 以降、IVF ベースの ANN index がサポートされています。本ドキュメントでは、IVF アルゴリズム、主要なパラメータ、エンジニアリングプラクティスについて説明し、本番環境の Doris クラスタで IVF ベースの ANN index を構築・調整する方法について解説します。

## IVF index とは？

完全性のため、歴史的な背景を示します。IVF（inverted file）という用語は、情報検索から生まれました。

いくつかのテキスト文書の簡単な例を考えてみましょう。指定した単語を含む文書を検索するため、**forward index** は各文書の単語リストを格納します。関連する文書を見つけるには、各文書を明示的に読み取る必要があります。

|Document|Words|
|---|---|
|Document 1|the,cow,says,moo|
|Document 2|the,cat,and,the,hat|
|Document 3|the,dish,ran,away,with,the,spoon|

対照的に、**inverted index** は検索可能なすべての単語の辞書を含み、各単語に対してその単語が出現する文書インデックスのリストを持ちます。これが inverted list（inverted file）であり、選択されたリストに検索を制限することを可能にします。

| Word | Documents                                                  |
| ---- | ---------------------------------------------------------- |
| the  | Document 1, Document 3, Document 4, Document 5, Document 7 |
| cow  | Document 2, Document 3, Document 4                         |
| says | Document 5                                                 |
| moo  | Document 7                                                 |

現在、テキストデータはしばしばベクトル埋め込みとして表現されます。IVF 手法はクラスタ中心を定義し、これらの中心は前述の例における単語の辞書に類似しています。各クラスタ中心に対して、そのクラスタに属するベクトルインデックスのリストを持ち、選択されたクラスタのみを検査すれば良いため検索が高速化されます。

## 効率的なベクトル検索のための IVF index の使用

データセットが数百万または数十億のベクトルまで成長すると、網羅的な正確な k 最近傍（kNN）検索を実行し、クエリとデータベース内のすべてのベクトル間の距離を計算することは、計算的に実行困難になります。この総当たりアプローチは大きな行列乗算と同等であり、スケールしません。

幸い、多くのアプリケーションでは、わずかな精度を犠牲にして大幅な速度向上を得ることができます。これが近似最近傍（ANN）検索の領域であり、Inverted File（IVF）index は最も広く使用され効果的な ANN 手法の一つです。

IVF の背後にある基本原理は「分割統治」です。データセット全体を検索する代わりに、IVF は検索範囲を少数の有望な領域に知的に絞り込み、必要な比較回数を大幅に削減します。

IVF は大きなベクトルデータセットをより小さく管理可能なクラスタに分割し、各クラスタは「centroid」と呼ばれる中心点で表現されます。これらの centroid はそれぞれのパーティションのアンカーとして機能します。検索時、システムはクエリベクトルに最も近い centroid を持つクラスタを素早く特定し、それらの内部のみを検索し、データセットの残りを無視します。

![ivf search](/images/vector-search/dataset-points-query-clusters.png)

## Apache Doris における IVF

Apache Doris は、バージョン 4.x から IVF ベースの ANN index の構築をサポートしています。

### Index 構築

ここで使用される index タイプは ANN です。ANN index を作成する方法は 2 つあります：table作成時に定義する方法、または `CREATE/BUILD INDEX` 構文を使用する方法です。これら 2 つのアプローチは、index がどのように、いつ構築されるかが異なり、したがって異なるシナリオに適合します。

アプローチ 1：table作成時にベクトル列に ANN index を定義します。データがロードされると、セグメントが作成される際に ANN index が構築されます。利点は、データロードが完了すると index がすでに構築されており、クエリが即座にそれを高速化に使用できることです。欠点は、同期的な index 構築がデータ取り込みを遅くし、コンパクション中に余分な index 再構築を引き起こし、リソースの無駄につながる可能性があることです。

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
データがロードされた後、`CREATE INDEX`を実行できます。この時点でインデックスはTable上で定義されますが、既存のデータに対してはまだインデックスが構築されていません。

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
`BUILD INDEX`は非同期で実行されます。ジョブのステータスを確認するには、`SHOW BUILD INDEX`（一部のバージョンでは`SHOW ALTER`）を使用できます。

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

不適切なANNインデックスは`ALTER TABLE sift_1M DROP INDEX idx_test_ann`で削除できます。インデックスの削除と再作成は、ハイパーパラメータ調整時に頻繁に行われます。これは、目的のrecallを達成するために異なるパラメータの組み合わせをテストする必要があるためです。


### Querying

ANNインデックスはTop‑N検索とrange検索の両方をサポートします。

ベクトル列が高次元の場合、クエリベクトル自体のリテラル表現が追加の解析オーバーヘッドを引き起こす可能性があります。そのため、完全なクエリベクトルを生のSQLに直接埋め込むことは、特に高い同時実行環境下では本番環境で推奨されません。より良い方法は、繰り返しのSQL解析を避けるprepared statementsを使用することです。

[doris-vector-search](httpsDorisでのベクトル検索に必要な操作をprepared statementsベースでラップし、Dorisのクエリ結果をPandasの`DataFrame`にマッピングするデータ変換ユーティリティを含む、便利な下流AI アプリケーション開発のためのpythonライブラリの使用を推奨します。

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
サンプル出力：

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


ベクトル検索において、recallは最も重要なメトリクスです。パフォーマンス数値は、特定のrecallレベルでのみ意味を持ちます。recallに影響を与える主な要因は以下の通りです：

1. IVFのインデックス時パラメータ（`nlist`）とクエリ時パラメータ（`nprobe`）
2. ベクトル量子化
3. セグメントサイズとセグメント数

本記事では、(1)と(3)がrecallに与える影響に焦点を当てます。ベクトル量子化については別の文書で扱います。


#### インデックスハイパーパラメータ

IVFインデックスは、ベクトルを複数のクラスタに編成します。インデックス構築時に、ベクトルはクラスタリングを使用してグループに分割されます。検索プロセスは、最も関連性の高いクラスタのみに焦点を当てます。ワークフローは大まかに以下の通りです：

インデックス時：

1. **クラスタリング**：すべてのベクトルが、クラスタリングアルゴリズム（例：k-means）を使用して`nlist`個のクラスタに分割されます。各クラスタの重心が計算され、保存されます。
2. **ベクトル割り当て**：各ベクトルは、重心が最も近いクラスタに割り当てられ、そのクラスタの転置リストに追加されます。

クエリ時：

1. **nprobeを使用したクラスタ選択**：クエリベクトルに対して、すべての`nlist`重心への距離が計算されます。検索対象として最も近い`nprobe`個のクラスタのみが選択されます。
2. **選択されたクラスタ内での全数検索**：最近傍を見つけるために、選択されたnprobe個のクラスタ内のすべてのベクトルとクエリが比較されます。

まとめ：

`nlist`はクラスタ（転置リスト）の数を定義します。これはrecall、メモリオーバーヘッド、構築時間に影響します。より大きな`nlist`はより細かいクラスタを作成し、クエリの最近傍が適切に局在化されている場合は検索速度を向上させることができますが、クラスタリングのコストと近傍が複数のクラスタに分散するリスクも増加させます。

`nprobe`はクエリ中に検索するクラスタ数を定義します。より大きな`nprobe`はrecallとクエリレイテンシを増加させます（より多くのベクトルが検査されます）。より小さなnprobeはクエリを高速化しますが、探索されないクラスタに存在する近傍を見逃す可能性があります。


デフォルトでは、Dorisは`nlist = 1024`と`nprobe = 64`を使用します。


上記は、これら2つのハイパーパラメータの定性的な分析です。以下の表は、SIFT_1Mデータセットでの実証結果を示しています：


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

1. インデックスのないTable`table_multi_index`を作成します。これは2つまたは3つのベクトル列を含むことができます。
2. Stream Loadまたは他の取り込み方法を使用して、`table_multi_index`にデータをロードします。
3. `CREATE INDEX`と`BUILD INDEX`を使用して、すべてのベクトル列にANNインデックスを構築します。
4. 異なる列で異なるインデックスパラメータ設定を使用します。インデックス構築が完了した後、各列でrecallを計算し、最適なパラメータの組み合わせを選択します。

例えば：

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
#### インデックスごとにカバーする行数


内部的に、Dorisは複数の層でデータを整理します。

- 最上位は**table**で、distribution keyを使用してN個の**tablet**に分割されます。tabletは、データシャーディング、再配置、リバランシングの単位として機能します。
- 各データ取り込みまたはcompactionにより、tablet下に新しい**rowset**が生成されます。rowsetは、データのバージョン管理されたコレクションです。
- rowset内のデータは実際に**segment**ファイルに格納されます。

転置インデックスと同様に、ベクトルインデックスは**segment**レベルで構築されます。segmentのサイズは、`write_buffer_size`や`vertical_compaction_max_segment_size`などのBE設定オプションによって決まります。取り込みとcompaction中に、メモリ内のmemtableが一定のサイズに達すると、segmentファイルとしてディスクにフラッシュされ、そのsegmentに対してベクトルインデックス（または複数のベクトル列に対する複数のインデックス）が構築されます。インデックスは、そのsegment内の行のみをカバーします。

IVFパラメータの固定セットが与えられた場合、インデックスが高いrecallを維持できるベクトルの数には常に制限があります。segment内のベクトル数がその制限を超えると、recallが低下し始めます。



> `SHOW TABLETS FROM table`を使用してTableのcompactionステータスを確認できます。対応するURLにアクセスすることで、そのTableが持つsegmentの数を確認できます。

#### CompactionのRecallへの影響

Compactionは、より大きなsegmentを作成する可能性があり、元のハイパーパラメータによって示される「カバレッジ容量」を超える可能性があるため、recallに影響を与える可能性があります。その結果、compaction前に達成されたrecallレベルが、compaction後にも維持されない場合があります。

`BUILD INDEX`を実行する前に、フルcompactionをトリガーすることを推奨します。完全にcompactionされたsegmentでインデックスを構築すると、recallが安定し、インデックス再構築によって引き起こされる書き込み増幅も削減されます。

### クエリパフォーマンス

#### インデックスファイルのコールドローディング

DorisのIVF ANNインデックスは、Metaのオープンソースライブラリ[Faiss](https://github.com/facebookresearch/faiss)を使用して実装されています。IVFインデックスは、メモリにロードされた後に有効になります。そのため、高並行性ワークロードを実行する前に、関連するすべてのsegmentインデックスがメモリにロードされていることを確認するため、いくつかのウォームアップクエリを実行することを推奨します。そうしないと、ディスクI/Oオーバーヘッドがクエリパフォーマンスを大幅に損なう可能性があります。

#### メモリフットプリント vs パフォーマンス

量子化や圧縮を使用しない場合、IVFインデックスのメモリフットプリントは、インデックス化するすべてのベクトルのメモリフットプリントの約1.02-1.1倍になります。

例えば、100万個の128次元ベクトルの場合、IVF-FLATインデックスには約以下が必要です：

`128 * 4 * 1,000,000 * 1.02 ≈ 500 MB`

参考値：

| dim | rows | estimated memory |
|-----|------|------------------|
| 128 | 1M   | 496 MB           |
| 768 | 1M   | 2.9 GB           |

安定したパフォーマンスを維持するため、各BEに十分なメモリがあることを確認してください。そうしないと、頻繁なスワップとインデックスファイルでのI/Oがクエリレイテンシを深刻に低下させます。

### ベンチマーク

ベンチマーク時は、デプロイメントモデルが本番環境のセットアップに従い、FEとBEが別々にデプロイされ、クライアントは別の独立したマシンで実行される必要があります。

ベンチマークフレームワークとして[VectorDBBench](https://github.com/zilliztech/VectorDBBench)を使用できます。

#### Performance768D1M

ベンチマークコマンド：

```bash
# load
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --skip-search-serial --skip-search-concurrent

# search
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --search-concurrent --search-serial --num-concurrency 10,40,80 --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --session-var ivf_nprobe=64 --skip-load --skip-drop-old
```
