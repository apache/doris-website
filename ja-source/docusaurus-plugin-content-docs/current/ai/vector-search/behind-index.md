---
{
  "title": "パフォーマンスの背景にある最適化",
  "language": "ja",
  "description": "Apache Dorisの初期バージョンは、オンライン分析処理（OLAP）に焦点を当てていました、"
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

Apache Dorisの初期バージョンは、オンライン分析処理（OLAP）に焦点を当てており、主にレポートと集約のワークロード、つまり複数テーブルのJOINやGROUP BYを含む一般的なクエリに使用されていました。2.xでは、Dorisは転置インデックスによる全文検索機能を追加し、効率的なJSON処理のためのVariant型を導入しました。3.xでは、ストレージとコンピュートの分離によりオブジェクトストレージを活用してストレージコストを大幅に削減できるようになりました。4.xでは、Dorisはベクトルインデックスとハイブリッドサーチ（ベクトル + テキスト）を導入してAI時代に参入し、DorisをエンタープライズAI分析プラットフォームとして位置付けています。本ドキュメントでは、Doris 4.xにおけるベクトルインデックスの実装方法と、最先端のパフォーマンスを達成するためのエンジニアリングの取り組みについて説明します。

ベクトルインデックスは、インデックス作成とクエリの2つの段階に分けられます。インデックス作成段階では、1) データシャーディング、2) 高品質インデックスの効率的な構築、3) インデックス管理に焦点を当てています。クエリ段階には単一の目標があります：冗長な計算と不要なIOを排除し、同期性を最適化してクエリパフォーマンスを向上させることです。

## インデックス作成段階
インデックス作成のパフォーマンスは、インデックスのハイパーパラメータと強く結びついています：インデックス品質が高いほど、通常は構築時間が長くなります。取り込みパスの最適化により、Dorisはインデックスの高品質を維持しながら取り込みスループットを向上させることができます。

768次元1000万データセットにおいて、Apache Dorisは業界最高レベルの取り込みパフォーマンスを実現しています。

![alt text](/images/vector-search/image-1.png)

### マルチレベルシャーディング
Apache Dorisの内部テーブルは本来分散型です。クエリと取り込み中、ユーザーは単一の論理テーブルと相互作用し、一方でDorisカーネルはテーブル定義に基づいて必要な数の物理タブレットを作成します。取り込み中、データはパーティションとバケットキーによって適切なBEタブレットにルーティングされます。複数のタブレットが組み合わさって、ユーザーが見る論理テーブルを形成します。各取り込みリクエストはトランザクションを形成し、対応するタブレット上にrowset（バージョニング単位）を作成します。各rowsetにはいくつかのセグメントが含まれており、セグメントが実際のデータキャリアです；ANNインデックスはセグメント粒度で動作します。

![テーブルからシャードまでの階層](/images/vector-search/image.png)

ベクトルインデックス（例：HNSW）は、インデックス品質とクエリパフォーマンスを直接決定する主要なハイパーパラメータに依存し、通常は特定のデータ規模に対して調整されます。Apache Dorisのマルチレベルシャーディングは「インデックスパラメータ」を「全テーブルデータ規模」から分離します：ユーザーは合計データが増加してもインデックスを再構築する必要はなく、バッチ単位の取り込みサイズに基づいてパラメータを調整するだけです。我々のテストから、異なるバッチサイズでのHNSW推奨パラメータは以下のとおりです：

| batch_size | max_degree | ef_construction | ef_search | recall@100 |
|------------|------------|-----------------|-----------|------------|
| 250000     | 100        | 200             | 50        | 89%        |
| 250000     | 100        | 200             | 100       | 93%        |
| 250000     | 100        | 200             | 150       | 95%        |
| 250000     | 100        | 200             | 200       | 98%        |
| 500000     | 120        | 240             | 50        | 91%        |
| 500000     | 120        | 240             | 100       | 94%        |
| 500000     | 120        | 240             | 150       | 96%        |
| 500000     | 120        | 240             | 200       | 99%        |
| 1000000    | 150        | 300             | 50        | 90%        |
| 1000000    | 150        | 300             | 100       | 93%        |
| 1000000    | 150        | 300             | 150       | 96%        |
| 1000000    | 150        | 300             | 200       | 98%        |

つまり、「バッチ単位の取り込みサイズ」に焦点を当て、品質と安定したクエリ動作を維持するために適切なインデックスパラメータを選択してください。

### 高性能インデックス構築

#### 並列・高品質インデックス構築

Dorisは2レベルの並列処理でインデックス構築を加速します：BEノード間でのクラスターレベルの並列処理と、グループ化されたバッチデータに対するノード内マルチスレッド距離計算です。速度に加えて、Dorisはインメモリバッチ処理によりインデックス品質を向上させます：総ベクトル数が固定でもバッチ処理が細かすぎると（頻繁な増分構築）、グラフ構造が疎になり再現率が低下します。例えば、768次元1000万データセットで10バッチで構築すると約99%の再現率に達する可能性がありますが、100バッチでは約95%まで低下する場合があります。インメモリバッチ処理は、同じハイパーパラメータの下でメモリ使用量とグラフ品質のバランスを取り、過度なバッチ処理による品質劣化を回避します。

#### SIMD

ANNインデックス構築における主要なコストは大規模な距離計算であり、これはCPUバウンドなワークロードです。Dorisはこの作業をBEノードに集約し、C++で実装し、Faissの自動および手動ベクトル化最適化を活用しています。L2距離について、Faissはコンパイラプラグマを使用して自動ベクトル化を促進します：

```cpp
FAISS_PRAGMA_IMPRECISE_FUNCTION_BEGIN
float fvec_L2sqr(const float* x, const float* y, size_t d) {
    size_t i; float res = 0;
    FAISS_PRAGMA_IMPRECISE_LOOP
    for (i = 0; i < d; i++) {
        const float tmp = x[i] - y[i];
        res += tmp * tmp;
    }
    return res;
}
FAISS_PRAGMA_IMPRECISE_FUNCTION_END
```
`FAISS_PRAGMA_IMPRECISE_*`を使用すると、コンパイラが自動ベクトル化を行います：

```cpp
#define FAISS_PRAGMA_IMPRECISE_LOOP \
    _Pragma("clang loop vectorize(enable) interleave(enable)")
```
Faissは、`ElementOpL2/ElementOpIP`と次元特化された`fvec_op_ny_D{1,2,4,8,12}`と組み合わせて、`#ifdef SSE3/AVX2/AVX512F`ブロック内で`_mm*`/`_mm256*`/`_mm512*`を使用した明示的なSIMDも適用し、以下を実現します：
- 反復あたり複数のサンプル（例：8/16）を処理し、レジスタレベルの転置を実行してメモリアクセスの局所性を改善
- FMA（例：`_mm512_fmadd_ps`）を使用して乗加算を融合し、命令数を削減
- 水平和を実行してスカラーを効率的に生成
- 非整列サイズに対してマスク読み取りを使用してテール要素を処理

これらの最適化により、命令とメモリのコストが削減され、インデックス作成のスループットが大幅に向上します。

## Querying Stage

検索はレイテンシに敏感です。数千万レコードで高い並行性がある場合、P99レイテンシは通常500ms未満である必要があり、オプティマイザ、実行エンジン、およびインデックス実装のハードルを上げます。すぐに使えるテストでは、Dorisは主流の専用ベクトルデータベースに匹敵するパフォーマンスを達成しています。以下のチャートは、Performance768D10MでDorisと他のシステムを比較したものです。ピアデータはZillizのオープンソース[VectorDBBench](https://github.com/zilliztech/VectorDBBench)から取得されています。

![alt text](/images/vector-search/image-2.png)

> 注意：このチャートには、すぐに使える結果のサブセットが含まれています。OpenSearchとElastic Cloudは、インデックスファイル数を最適化することでクエリパフォーマンスを向上させることができます。

### Prepare Statement
従来のパスでは、DorisはすべてのSQLに対して完全な最適化（解析、セマンティクス解析、RBO、CBO）を実行します。一般的なOLAPには必須ですが、シンプルで高度に反復的な検索クエリにはオーバーヘッドが追加されます。Doris 4.0は、Prepare Statementをポイントルックアップを超えて、ベクトル検索を含むすべてのSQLタイプに拡張しています：
1. コンパイルと実行の分離
   - Prepareは解析、セマンティクス、最適化を一度実行し、再利用可能なLogical Planを生成します。
   - Executeは実行時にパラメータをバインドし、事前構築されたプランを実行し、オプティマイザを完全にスキップします。
2. Plan cache
   - 再利用はSQLフィンガープリント（正規化されたSQL + スキーマバージョン）によって決定されます。
   - 同じ構造で異なるパラメータ値を持つものは、キャッシュされたプランを再利用し、再最適化を回避します。
3. スキーマバージョンチェック
   - 実行時にスキーマバージョンを検証して正確性を保証します。
   - 変更なし → 再利用；変更あり → 無効化して再準備。
4. オプティマイザをスキップすることによる高速化
   - ExecuteはもはやRBO/CBOを実行せず、オプティマイザ時間がほぼ排除されます。
   - テンプレートが多用されるベクトルクエリは、エンドツーエンドレイテンシが大幅に低減されることで恩恵を受けます。

### Index Only Scan
Dorisはベクトルインデックスを外部（プラガブル）インデックスとして実装し、管理を簡素化し、非同期ビルドをサポートしますが、冗長な計算とIOを回避するなどのパフォーマンス上の課題が生じます。ANNインデックスは、行IDに加えて距離を返すことができます。Dorisは「仮想列」を介してScanオペレータ内の距離式をショートサーキットすることでこれを活用し、Ann Index Only Scanは距離関連の読み取りIOを完全に排除します。
ナイーブなフローでは、Scanは述語をインデックスにプッシュし、インデックスは行IDを返し、Scanはデータページを読み取り、式を計算してからN行を上流に返します。

![alt text](/images/vector-search/image-3.png)

Index Only Scanが適用されると、フローは次のようになります：

![alt text](/images/vector-search/image-4.png)

例えば、`SELECT l2_distance_approximate(embedding, [...]) AS dist FROM tbl ORDER BY dist LIMIT 100;`はデータファイルに触れることなく実行されます。

Ann TopN Searchを超えて、Range SearchとCompound Searchも同様の最適化を採用します。Range Searchはより微妙です：インデックスが`dist`を返すかどうかはコンパレータに依存します。以下は、Ann Index Only Scanに関連するクエリタイプとIndex Scanが適用されるかどうかを示しています：

```SQL
-- Sql1: Range + proj
-- Index returns dist; no need to recompute dist
-- Virtual column for CSE avoids dist recomputation in proj
-- IndexScan: True
select id, dist(embedding, [...]) from tbl where dist <= 10;

-- Sql2: Range + no-proj
-- Index returns dist; no need to recompute
-- IndexScan: True
select id from tbl where dist <= 10 order by id limit N;

-- Sql3: Range + proj + no-dist-from index
-- Index cannot return dist (only updates rowid map)
-- proj requires dist → embedding must be reread
-- IndexScan: False
select id, dist(embedding, [...]) from tbl where dist > 10;

-- Sql4: Range + proj + no-dist-from index
-- Index cannot return dist, but proj does not need dist → embedding not reread
-- IndexScan: True
select id from tbl where dist > 10;

-- Sql5: TopN
-- Index returns dist; virtual slot for CSE uploads dist to proj
-- embedding column not read
-- IndexScan: True
select id[, dist(embedding, [...])] from tbl order by dist(embedding, [...]) asc limit N;

-- Sql6: TopN + IndexFilter
-- 1) comment not read (inverted index already optimizes this)
-- 2) embedding not read (same reason as Sql5)
-- IndexScan: True
select id[, dist(embedding, [...])] from tbl where comment match_any 'olap' ORDER BY dist(embedding, [...]) LIMIT N;

-- Sql7: TopN + Range
-- IndexScan: True (combination of Sql1 and Sql5)
select id[, dist(embedding, [...])] from tbl where dist(embedding, [...]) > 10 order by dist(embedding, [...]) limit N;

-- Sql8: TopN + Range + IndexFilter
-- IndexScan: True (combination of Sql7 and Sql6)
select id[, dist(embedding, [...])] from tbl where comment match_any 'olap' and dist(embedding, [...]) > 10 ORDER BY dist(embedding, [...]) LIMIT N;

-- Sql9: TopN + Range + CommonFilter
-- Key points: 1) dist < 10 (not > 10); 2) common filter reads dist, not embedding
-- Index returns dist; virtual slot for CSE ensures all reads refer to the same column
-- In theory embedding need not materialize; in practice it still does due to residual predicates on the column
-- IndexScan: False
select id[, dist(embedding, [...])] from tbl where comment match_any 'olap' and dist(embedding, [...]) < 10 AND abs(dist(embedding) + 10) > 10 ORDER BY dist(embedding, [...]) LIMIT N;

-- Sql10: Variant of Sql9, dist < 10 → dist > 10
-- Index cannot return embedding; to compute abs(dist(embedding,...)) embedding must materialize
-- IndexScan: False
select id[, dist(embedding, [...])] from tbl where comment match_any 'olap' and dist(embedding, [...]) > 10 AND abs(dist(embedding) + 10) > 10 ORDER BY dist(embedding, [...]) LIMIT N;

-- Sql11: Variant of Sql9, abs(dist(...)+10) > 10 → array_size(embedding) > 10
-- array_size requires embedding materialization
-- IndexScan: False
select id[, dist(embedding, [...])] from tbl where comment match_any 'olap' and dist(embedding, [...]) < 10 AND array_size(embedding) > 10 ORDER BY dist(embedding, [...]) LIMIT N;
```
### CSEのためのVirtual Columns

Index Only Scanは主にIO（embeddingのランダム読み取り）を削減します。冗長な計算をさらに除去するため、Dorisはインデックスが返す`dist`を列として式エンジンに渡すvirtual columnsを導入しています。
設計のハイライト：
1. 式ノード`VirtualSlotRef`
2. 列イテレータ`VirtualColumnIterator`

`VirtualSlotRef`は計算時に生成される列です：1つの式によってマテリアライズされ、多くの場所で再利用可能で、初回使用時に1度だけ計算されます—ProjectionとPredicates間でCSEを削減します。`VirtualColumnIterator`はインデックスが返す距離を式にマテリアライズし、距離計算の繰り返しを回避します。最初はANNクエリのCSE削減のために構築されましたが、このメカニズムはProjection + Scan + Filterに一般化されました。
ClickBenchデータセットを使用して、以下のクエリはGoogleクリック数による上位20のWebサイトをカウントします：

```sql
set experimental_enable_virtual_slot_for_cse=true;

SELECT counterid,
       COUNT(*)               AS hit_count,
       COUNT(DISTINCT userid) AS unique_users
FROM   hits
WHERE  ( UPPER(regexp_extract(referer, '^https?://([^/]+)', 1)) = 'GOOGLE.COM'
         OR UPPER(regexp_extract(referer, '^https?://([^/]+)', 1)) = 'GOOGLE.RU'
         OR UPPER(regexp_extract(referer, '^https?://([^/]+)', 1)) LIKE '%GOOGLE%' )
       AND ( LENGTH(regexp_extract(referer, '^https?://([^/]+)', 1)) > 3
              OR regexp_extract(referer, '^https?://([^/]+)', 1) != ''
              OR regexp_extract(referer, '^https?://([^/]+)', 1) IS NOT NULL )
       AND eventdate = '2013-07-15'
GROUP  BY counterid
HAVING hit_count > 100
ORDER  BY hit_count DESC
LIMIT  20;
```
コア表現である`regexp_extract(referer, '^https?://([^/]+)', 1)`はCPU集約的であり、述語間で再利用されます。仮想列を有効にした場合（`set experimental_enable_virtual_slot_for_cse=true;`）：
- 有効: 0.57秒
- 無効: 1.50秒

エンドツーエンドのパフォーマンスが約3倍向上します。

### スキャン並列化の最適化
DorisはAnn TopN検索のスキャン並列化を刷新しました。従来のポリシーでは行数で並列度を設定していました（デフォルト：1スキャンタスクあたり2,097,152行）。セグメントはサイズベースであるため、高次元ベクトル列では1セグメントあたりの行数がはるかに少なくなり、1つのスキャンタスク内で複数のセグメントが連続的にスキャンされることになります。Dorisは「1セグメントあたり1スキャンタスク」に切り替え、インデックススキャンの並列度を向上させました。Ann TopNは高いフィルタ率（N行のみ返却）を持つため、バック・トゥ・テーブル段階はシングルスレッドのままでもパフォーマンスに影響しません。SIFT 1Mにおいて：
`set optimize_index_scan_parallelism=true;`
TopNシングルスレッドクエリのレイテンシが230msから50msに低下しました。
さらに、4.0では動的並列化を導入：各スケジューリングラウンド前に、Dorisはスレッドプールの負荷に基づいて投入するスキャンタスク数を調整します。高負荷時はタスクを減らし、アイドル時は増やすことで、シリアルワークロードと並行ワークロード間でのリソース使用量とスケジューリングオーバーヘッドのバランスを取ります。

### グローバルTopN遅延マテリアライゼーション
典型的なAnn TopNクエリは2つの段階で実行されます：
1. スキャンがインデックスを介してセグメントごとのTopN距離を取得
2. グローバルソートがセグメントごとのTopNをマージして最終的なTopNを生成

プロジェクションが多数の列や大きな型（例：String）を返す場合、段階1で各セグメントからN行を読み取ることで重いIOが発生する可能性があり、多くの行は段階2のグローバルソート中に破棄されます。DorisはグローバルTopN遅延マテリアライゼーションを使用して段階1のIOを最小化します。
`SELECT id, l2_distance_approximate(embedding, [...]) AS dist FROM tbl ORDER BY dist LIMIT 100;`の場合：段階1ではAnn Index Only Scan + 仮想列を通じて、セグメントごとに100個の`dist`値とrowidのみを出力します。Mセグメントがある場合、段階2では`100 * M`個の`dist`値をグローバルソートして最終的なTopNとrowidを取得し、その後Materializeオペレータが対応するtablet/rowset/segmentからrowidによって必要な列を取得します。
