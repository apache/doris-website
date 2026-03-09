---
{
  "title": "リリース 3.1.0",
  "language": "ja",
  "description": "Apache Doris 3.1の正式リリースを発表できることを嬉しく思います。"
}
---
**Apache Doris 3.1**の正式リリースを発表いたします。これは、半構造化データとlakehouse分析をより強力で実用的にするマイルストーン版です。

Doris 3.1では、**VARIANT データ型のsparse columnsとschema template**を導入し、ユーザーが数万の動的フィールドを持つデータセットを効率的に保存、インデックス、クエリできるようになりました。これは、ログ、イベント、JSON中心のワークロードに最適です。

lakehouse機能については、Doris 3.1では**asynchronous materialized view**をlakehouseに導入し、データレイクとデータウェアハウス間のより強固な橋渡しを構築します。また、**IcebergとPaimon**のサポートを拡張し、複雑なlakehouseワークロードの管理をより簡単で効率的にします。

Apache Doris 3.1の開発期間中、**90人以上の貢献者**が**1,000を超える改善と修正**を提出しました。開発、テスト、フィードバックを通じて貢献いただいたすべての方に心から感謝申し上げます。

**[GitHub でApache Doris 3.1をダウンロード](https://github.com/apache/doris/releases)** 

**[公式ウェブサイトからダウンロード](https://doris.apache.org/download)** 

### Apache Doris 3.1の主なハイライト

- **半構造化データ分析**
  - VARIANT型の**Sparse columns**で、数万のサブカラムをサポート
  - VARIANTの**Schema template**により、柔軟性を失うことなく、より高速なクエリ、より安定したインデックス、制御可能なコストを実現
  - **Inverted Indexes Storage Format**をV2からV3にアップグレードし、ストレージ使用量を最大**20%**削減
  - 3つの新しいtokenizer：**ICU Tokenizer**、**IK Tokenizer**、**Basic Tokenizer**。また、**custom tokenizers**のサポートを追加し、多様なシナリオでの検索再現率を大幅に向上
- **Lakehouse アップグレード**
  - **Better materialized views features**をデータレイクに導入し、データレイクとデータウェアハウス間の橋渡しを強化
  - **Iceberg**と**Paimon**の幅広いサポート
  - **Dynamic partition pruning**と**batch splits scheduling**により、特定のクエリワークロードを最大**40%**改善し、FE（フロントエンド）メモリ消費を削減
  - Doris 3.1では**外部データソースの接続プロパティ**をリファクタリングし、さまざまなメタデータサービスやストレージシステムとの統合において、より明確な方法とより柔軟な接続オプションを提供
- **ストレージエンジンの改善**
  - **New flexible column updates**：部分カラム更新を基に、単一のインポート内で各行に対して異なるカラムを更新することが可能
  - ストレージ・コンピュート分離シナリオでは、Doris 3.1は**MOW tables**のロックメカニズムを最適化し、高同時実行データ取り込みのエクスペリエンスを向上
- **パフォーマンス最適化**
  - Doris 3.1では**partition pruningとquery planning**を強化し、大きなパーティション（数万）と複雑なフィルタ式でより高速なクエリと低いリソース使用量を実現
  - オプティマイザーでは**data-aware optimization techniques**も導入し、特定のワークロードで最大**10倍のパフォーマンス向上**を実現

## 1. VARIANT 半構造化データ分析が大幅アップグレード

### ストレージ機能：Sparse columnsとSubcolumns Vertical Compaction

従来のOLAPシステムは、数千から数万のカラムを含む「超ワイドテーブル」でしばしば苦労し、メタデータの肥大化、コンパクション増幅、クエリパフォーマンスの低下に直面していました。**Doris 3.1**では、VARIANT型の**sparse subcolumns**と**subcolumn-level vertical compaction**でこれに対処し、実用的なカラム制限を数万まで押し上げます。

**VARIANTはストレージレイヤーでの徹底的な最適化により、以下の利点をもたらします：**

- カラムナーストレージでの**サブカラム（数千から数万）の安定サポート**により、よりスムーズなクエリとコンパクション遅延の削減を実現
- **制御可能なメタデータとインデックス**により、指数的増加を防止
- **10,000を超えるサブカラムのSubcolumnarization**（カラムナーストレージ）を実世界のテストで実現可能、スムーズで効率的なコンパクションパフォーマンス

**超ワイドテーブルの主要使用例：**

- **コネクテッドビークル / IoTテレメトリ：** さまざまなデバイスモデルと動的に変化するセンサー次元をサポート
- **マーケティングオートメーション / CRM：** 継続的に拡張するイベントとユーザー属性（例：カスタムイベント/プロパティ）
- **広告 / イベントトラッキング：** スパースで継続的に進化するフィールドを持つ大規模なオプションプロパティ
- **セキュリティ監査 / ログ：** 多様なログソースが異なるフィールドを持ち、スキーマによる集約と検索が必要
- **eコマース商品属性：** 高度に可変な商品属性を持つ幅広いカテゴリ範囲

**動作原理：** 

- **頻繁なJSONキーが実カラムになる**

	最も一般的なJSONキーを真のカラムナーサブカラムとして自動的に保持します。これによりクエリが高速になり、メタデータが小さく保たれます。稀なキーはコンパクトな「sparse」エリアに留まるため、テーブルが肥大化しません。

- **サブカラム用のスマートで低メモリマージ**

	VARIANTサブカラムを小さな垂直グループでマージし、メモリ使用量を大幅に削減し、数千のフィールドでもバックグラウンドメンテナンスをスムーズに保ちます。ホットキーは自動的に検出されサブカラムに昇格します。

- **欠損値の高速処理**

	読み取りとマージ時の行ごとのオーバーヘッドを削減するため、デフォルト値をバッチ補完します。

- **LRUキャッシュによる軽量メタデータ**

	カラムメタデータはLRUポリシーでキャッシュされ、メモリ使用量を削減し、繰り返しアクセスを高速化します。つまり：重要なフィールドでカラムナー速度を得られ、ロングテールに対する高いコストを支払うことなく、バックグラウンド操作がスムーズで予測可能に保たれます。

**有効化と使用方法：** 

新しいカラムレベルのVariantパラメータ制御、カラムプロパティ：

`variant_max_subcolumns_count`: デフォルトは`0`で、sparse subcolumnサポートが無効であることを意味します。特定の値に設定すると、システムは最も頻繁なTop-N JSONキーをカラムナーストレージ用に抽出し、残りのキーはスパースに保存されます。

```SQL
-- Enable sparse subcolumns and cap hot subcolumn count
CREATE TABLE IF NOT EXISTS tbl (
  k BIGINT,
  v VARIANT<
      properties("variant_max_subcolumns_count" = "2048") -- pick top-2048 hot keys
  >
) DUPLICATE KEY(k);
```
### スキーマテンプレート

スキーマテンプレートは、常に変化するJSONを重要なパス上で予測可能にします。これにより、クエリの実行が高速化され、インデックスが安定し、柔軟性を失うことなくコストを制御できます。利点は以下の通りです：

- **型の安定性**: 主要なJSONサブパスの型をDDLで固定し、クエリエラー、インデックス無効化、暗黙的キャストのオーバーヘッドを引き起こす型のドリフトを防ぎます。
- **より高速で正確な検索**: サブパスごとに転置インデックス戦略（トークン化/非トークン化、パーサー、フレーズ検索）を調整し、レイテンシを削減してヒット率を向上させます。
- **制御されたインデックス作成とコスト**: 列全体にインデックスを作成するのではなく、サブパスごとにインデックスを調整し、インデックス数、書き込み増幅、ストレージ使用量を大幅に削減します。
- **保守性とコラボレーション**: JSONの「データコントラクト」として機能し、チーム間でセマンティクスの一貫性を保ちます。型とインデックス状態の観察とデバッグが容易になります。
- **進化の容易さ**: ホットパスをテンプレート化し、オプションでインデックスを作成する一方で、ロングテールフィールドは柔軟に保つため、予期しない問題なくスケールできます。

**有効化と使用方法：**

- `VARIANT<...>`内で共通のサブパスと型（ワイルドカードを含む）を明示的に宣言します。例：`VARIANT<'a': INT, 'c.d': TEXT, 'array_int_*': ARRAY<INT>>`。
- サブパスごとのインデックスを差別化された戦略（`field_pattern`、`parsers`、`tokenization`、`phrase`検索）で設定し、ワイルドカードを使用してフィールドファミリを一度にカバーします。
- 新しい列プロパティ：`variant_enable_typed_paths_to_sparse`
- デフォルト：`false`（型付けされた事前定義パスはスパースに格納されません）。
- 多数のパスがマッチし、列の拡散を避けたい場合に、型付けパスもスパース候補として扱うためにtrueに設定します。

要約：重要なものをテンプレート化し、正確にインデックスを作成し、他のすべてを柔軟に保ちます。

**例1：** 単一列に複数のインデックスを持つスキーマ定義

```SQL
-- Common properties: field_pattern (target subpath), analyzer, parser, support_phrase, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>, -- specify concrete type for subcolumn 'content'
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"), -- tokenized inverted index for 'content' with english parser
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content") -- non-tokenized inverted index for 'content'
);

-- v.content will have both a tokenized (english) inverted index and a non-tokenized inverted index

-- Use tokenized index
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';

-- Use non-tokenized index
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```
**例2:** ワイルドカードパターンにマッチする列のバッチ処理

```SQL
-- Use wildcard-typed subpaths with per-pattern indexes
CREATE TABLE IF NOT EXISTS tbl2 (
  k BIGINT,
  v VARIANT<
      'pattern1_*' : STRING, -- batch-typing: all subpaths matching pattern1_* are STRING
      'pattern2_*' : BIGINT, -- batch-typing: all subpaths matching pattern2_* are BIGINT
      properties("variant_max_subcolumns_count" = "2048") -- enable sparse subcolumns; keep top-2048 hot keys
  >,
  INDEX idx_p1 (v) USING INVERTED
    PROPERTIES("field_pattern"="pattern1_*", "parser" = "english"), -- tokenized inverted index for pattern1_* with english parser
  INDEX idx_p2 (v) USING INVERTED
    PROPERTIES("field_pattern"="pattern2_*") -- non-tokenized inverted index for pattern2_*
) DUPLICATE KEY(k);
```
**例3:** 事前定義された型付き列のスパース格納を許可する

```SQL
-- Allow predefined typed paths to participate in sparse extraction
CREATE TABLE IF NOT EXISTS tbl3 (
  k BIGINT,
  v VARIANT<
    'message*' : STRING, -- batch-typing: all subpaths matching prefix 'message*' are STRING
    properties(
      "variant_max_subcolumns_count" = "2048",              -- enable sparse subcolumns; keep top-2048 hot keys
      "variant_enable_typed_paths_to_sparse" = "true"       -- include typed (predefined) paths as sparse candidates (default: false)
    )
  >
) DUPLICATE KEY(k);
```
## 1. 転置インデックス ストレージ フォーマット V3

V2と比較して、転置インデックス V3はストレージをさらに最適化します：

- より小さなインデックスファイルにより、ディスク使用量とI/Oオーバーヘッドを削減します。
- httplogsとlogsbenchデータセットでのテストでは、V3で最大20%のストレージ容量削減が示されており、大規模なテキストデータとログ分析シナリオに最適です。

| Test dataSet | Data size before import | inverted_index_storage_format = v2 | inverted_index_storage_format = v3 | Space saving: V3 vs. V2 |
| :----------- | :---------------------- | :--------------------------------- | :--------------------------------- | :---------------------- |
| httplogs     | 30.89 GB                | 4.472 GB                           | 3.479 GB                           | 22.2%                   |
| logsbench    | 1479.31 GB              | 182.180 GB                         | 138.008 GB                         | 24.2%                   |

**主要な改善点:**

- **転置インデックス用語辞書にZSTD辞書圧縮を導入**し、インデックスプロパティの`dict_compression`で有効化できます。
- **転置インデックス内の各用語に関連する位置情報の圧縮を追加**し、ストレージフットプリントをさらに削減します。

**使用方法:**

```SQL
-- Enable V3 format when creating the table
CREATE TABLE example_table (
    content TEXT,
    INDEX content_idx (content) USING INVERTED
    PROPERTIES("parser" = "english", "dict_compression" = "true")
) ENGINE=OLAP
PROPERTIES ("inverted_index_storage_format" = "V3");
```
### Full-Text Search Tokenizer

Doris 3.1では、多様なトークン化ニーズにより適切に対応するため、新しく一般的に使用されるtokenizerを追加しました：

1. **ICU Tokenizer:**

- **実装:** International Components for Unicode (ICU)をベースにしています。
- **使用例:** 複雑な文字体系を持つ国際化テキストや多言語ドキュメントに最適です。
- **例:**

```SQL
SELECT TOKENIZE('مرحبا بالعالم Hello 世界', '"parser"="icu"');
-- Results: ["مرحبا", "بالعالم", "Hello", "世界"]

SELECT TOKENIZE('มนไมเปนไปตามความตองการ', '"parser"="icu"');
-- Results: ["มน", "ไมเปน", "ไป", "ตาม", "ความ", "ตองการ"]
```
2. **Basic Tokenizer**

- **実装**: 基本的な文字種認識を使用したシンプルなルールベースのカスタムtokenizer。
- **使用例**: シンプルなシナリオまたは非常に高いパフォーマンス要件があるケース。
- **ルール**:
  - 連続する英数字は一つのtokenとして扱われます。
  - 各中国語文字は個別のtokenです。
  - 句読点、スペース、特殊文字は無視されます。
- **例**:

```SQL
-- English text tokenization
SELECT TOKENIZE('Hello World! This is a test.', '"parser"="basic"');
-- Results: ["hello", "world", "this", "is", "a", "test"]

-- Chinese text tokenization
SELECT TOKENIZE('你好世界', '"parser"="basic"');
-- Results: ["你", "好", "世", "界"]

-- Mixed-language tokenization
SELECT TOKENIZE('Hello你好World世界', '"parser"="basic"');
-- Results: ["hello", "你", "好", "world", "世", "界"]

-- Handling numbers and special characters
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0', '"parser"="basic"');
-- Results: ["get", "images", "hm", "bg", "jpg", "http", "1", "0"]

-- Processing long numeric sequences
SELECT TOKENIZE('12345678901234567890', '"parser"="basic"');
-- Results: ["12345678901234567890"]
```
**カスタムトークン化**

新しい**カスタムトークン化**機能により、ユーザーはニーズに応じてトークン化ロジックを設計でき、テキスト検索のリコールを向上させることができます。

文字フィルタ、トークナイザー、トークンフィルタを組み合わせることで、ユーザーは組み込みアナライザーの制限を超えて、テキストを検索可能な用語にどのように分割するかを正確に定義でき、検索の関連性と分析精度の両方に直接影響を与えます。

![Custom Tokenization](/images/release-3.1/custom-tokenization.png)

**使用例**

- **問題**: デフォルトのUnicodeトークナイザーでは、「13891972631」のような電話番号は単一のトークンとして扱われるため、前方一致検索（例：「138」）ができません。
- **解決策**:
  - **Edge N-gram**カスタムトークナイザーを使用してトークナイザーを作成します：
  - ```SQL
     CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_phone_tokenizer
      PROPERTIES
      (
          "type" = "edge_ngram",
          "min_gram" = "3",
          "max_gram" = "10",
          "token_chars" = "digit"
      );

    ```

  - Create an analyzer: 
  - ```SQL
    CREATE INVERTED INDEX ANALYZER IF NOT EXISTS phone_prefix_analyzer
      PROPERTIES
      (
          "tokenizer" = "edge_ngram_phone_tokenizer"
      );
    ```
- テーブル作成時にアナライザーを指定する

    ```SQL
    CREATE TABLE customer_contacts (
          id bigint NOT NULL AUTO_INCREMENT(1),
          phone text NULL,
          INDEX idx_phone (phone) USING INVERTED PROPERTIES(
              "analyzer" = "phone_prefix_analyzer"
          )
      ) ENGINE=OLAP
      DUPLICATE KEY(id)
      DISTRIBUTED BY RANDOM BUCKETS 1
      PROPERTIES ("replication_allocation" = "tag.location.default: 1");
    ```
- トークン化結果を確認する:

    ```SQL
    SELECT tokenize('13891972631', '"analyzer"="phone_prefix_analyzer"');
    +----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
    | tokenize('13891972631', '"analyzer"="phone_prefix_analyzer"')                                                                                                                                                                                                                                |
    +----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
    | [{
            "token": "138"
        }, {
            "token": "1389"
        }, {
            "token": "13891"
        }, {
            "token": "138919"
        }, {
            "token": "1389197"
        }, {
            "token": "13891972"
        }, {
            "token": "138919726"
        }, {
            "token": "1389197263"
        }] |
    +----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
    ```
- テキスト検索結果

    ```SQL
    SELECT * FROM customer_contacts_optimized WHERE phone MATCH '138';
    +------+-------------+
    | id   | phone       |
    +------+-------------+
    |    1 | 13891972631 |
    |    2 | 13812345678 |
    +------+-------------+
    SELECT * FROM customer_contacts_optimized WHERE phone MATCH '1389';
    +------+-------------+
    | id   | phone       |
    +------+-------------+
    |    1 | 13891972631 |
    |    2 | 13812345678 |
    +------+-------------+
    2 rows in set (0.043 sec)
    ```
- Edge N-gramトークナイザーを使用することで、電話番号は複数のプレフィックストークンに分割され、柔軟なプレフィックスマッチング検索が可能になります。

## 3. Lakehouse機能のアップグレード

### 非同期マテリアライズドビューがデータレイクを完全サポート

バージョン3.1では、非同期マテリアライズドビューが大幅に強化され、パーティションレベルのインクリメンタルメンテナンスとパーティションレベルの透過的クエリリライティングの包括的なサポートを提供するようになりました。この機能は、Iceberg、Paimon、Hudiなどのデータレイク形式で利用できます。

Dorisはバージョン2.1で非同期マテリアライズドビューを導入し、以下を含む改良を継続的に行ってきました：

| 機能 | 説明 |
| :-------------------- | :----------------------------------------------------------- |
| Refresh | 内部テーブルとHiveテーブルの完全および パーティションレベルインクリメンタルメンテナンス |
| Trigger Methods | スケジュールされたリフレッシュ、全てのタイプのテーブルに対する手動リフレッシュ、および内部テーブルのみのコミットによるリフレッシュ |
| partitioning | ベーステーブルと同じパーティショニング、パーティションローリング、マルチレベルパーティション、ベーステーブルの特定の「ホット」パーティションの保持などの機能 |
| Transparent Rewriting | 内部テーブルに対する条件補償、結合リライティングと派生、集約リライティング、パーティション補償をサポート |
| Maintenance Tools | マテリアライズドビューのランタイム情報を照会するためのtasks()、jobs()、mv_infos()を提供 |

バージョン3.1では、クエリリライティング時に外部テーブルのパーティションレベルインクリメンタルメンテナンスとパーティションレベル補償の包括的なサポートを提供することで、lakehouse機能の強化に焦点を当てています。この強化は、Iceberg、Paimon、Hudiなどの主要なデータレイクテーブル形式を対象とし、データレイクとデータウェアハウス間の高速データブリッジを効果的に作成します。サポートの詳細な範囲は以下のテーブルで概説されています。

**具体的なサポート詳細は以下をご覧ください：**

| External Source | Partition Refresh | Transparent Partition Rewriting |
| :-------------- | :----------------------------------------------------------- | :------------------------------ |
| Hive | サポート済み | サポート済み |
| Iceberg | サポート済み | サポート済み |
| Paimon | サポート済み | サポート済み |
| Hudi | パーティション同期を検出できない；特定のパーティションを手動でリフレッシュするのに適している | サポート済み |

### IcebergとPaimonのより良いサポート

#### 1. Iceberg

Doris 3.1では、Icebergテーブル形式に対する幅広い最適化と機能強化を導入し、最新のIceberg機能との互換性を提供しています。

**Branch / Tagライフサイクル管理**

3.1以降、DorisはIceberg BranchesとTagsの作成、削除、読み取り、書き込みをネイティブサポートします。Gitと同様に、これによりユーザーはIcebergテーブルデータのバージョンをシームレスに管理できます。この機能により、ユーザーは外部エンジンやカスタムロジックに依存することなく、並列バージョン管理、カナリアリリース、環境分離を実行できます。

```SQL
-- Create branches
ALTER TABLE iceberg_tbl CREATE BRANCH b1;
-- Write data to a specific branch
INSERT INTO iceberg_tbl@branch(b1) values(1, 2);
-- Query data from a specific branch
SELECT * FROM iceberg_tbl@branch(b1);
```
**包括的なシステムテーブルサポート**

Doris 3.1では、`$entries`、`$files`、`$history`、`$manifests`、`$refs`、`$snapshots`などのIcebergシステムテーブルのサポートが追加されました。ユーザーは`SELECT * FROM iceberg_table$history`や`…$refs`などのコマンドでIcebergを直接クエリして、メタデータ、スナップショット履歴、branch/tagマッピング、およびファイル構成を検査できます。これにより、メタデータの可観測性が劇的に向上し、問題診断、パフォーマンスチューニング、およびガバナンスがより透明になります。

`SELECT * FROM iceberg_table$history`や`…$refs`などのステートメントを使用して、Icebergの基盤となるメタデータ、スナップショットリスト、branch、およびtag情報を直接クエリできます。これにより、データファイルの構成、スナップショット変更の履歴、およびbranchマッピングに関する深い洞察を得ることができます。この機能により、Icebergメタデータの可観測性が大幅に向上し、問題のトラブルシューティング、最適化分析の実行、およびガバナンス決定をより簡単かつ透明に行えるようになります。

**例：** システムテーブル経由で削除されたファイル数をクエリする。

```SQL
SELECT
  CASE
    WHEN content = 0 THEN 'DataFile'
    WHEN content = 1 THEN 'PositionDeleteFile'
    WHEN content = 2 THEN 'EqualityDeleteFile'
    ELSE 'Unknown'
  END AS ContentType,
  COUNT(*) AS FileNum,
  SUM(file_size_in_bytes) AS SizeInBytes,
  SUM(record_count) AS Records
FROM
  iceberg_table$files
GROUP BY
  ContentType;

+--------------------+---------+-------------+---------+
| ContentType        | FileNum | SizeInBytes | Records |
+--------------------+---------+-------------+---------+
| EqualityDeleteFile |    2787 |     1432518 |   27870 |
| DataFile           |    2787 |     4062416 |   38760 |
| PositionDeleteFile |      11 |       36608 |   10890 |
+--------------------+---------+-------------+---------+
```
**Iceberg Viewのクエリ対応**

Doris 3.1では、Iceberg論理ビューへのアクセスとクエリのサポートが追加され、DorisのIceberg機能がさらに強化されました。今後の3.xリリースでは、Iceberg ViewのSQLダイアレクト変換サポートを追加する予定です。

**ALTER文によるスキーマ進化**

3.1以降、DorisはALTER TABLE文を通じてIcebergテーブルでの列の追加、削除、名前変更、並び替えをサポートします。これにより、DorisはSparkなどのサードパーティエンジンを必要とせずにIcebergテーブルを管理する能力がさらに強化されます。

```SQL
ALTER TABLE iceberg_table
ADD COLUMN new_col int;
```
さらに、バージョン 3.1 では、新しい Iceberg 機能をより適切にサポートするため、Iceberg 依存関係がバージョン 1.9.2 にアップグレードされました。将来の 3.1.x リリースでは、データ圧縮やブランチ進化を含む Iceberg テーブル管理がさらに改善される予定です。

ドキュメント: https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog

#### 2. Paimon

Doris 3.1 では、実際の使用事例に基づいて Paimon テーブル形式にいくつかの更新と拡張がもたらされました。

**Paimon バッチ増分クエリのサポート**

Doris 3.1 では、Paimon テーブル内の2つの指定されたスナップショット間の増分データを読み取ることができます。これにより、ユーザーは Paimon 増分データにより適切にアクセスでき、特に Paimon テーブルでの増分集約マテリアライズドビューが可能になります。

```SQL
SELECT * FROM paimon_tbl@incr('startSnapshotId'='2', 'endSnapshotId'='5');
```
**ブランチとタグの読み取り**

3.1以降、DorisはPaimonテーブルデータのブランチとタグからの読み取りをサポートし、より柔軟なマルチバージョンデータアクセスを提供します。

```SQL
SELECT * FROM paimon_tbl@branch(branch1);
SELECT * FROM paimon_tbl@tag(tag1);
```
**包括的なシステムテーブルサポート**

Icebergと同様に、3.1では`$files`、`$partitions`、`$manifests`、`$tags`、`$snapshots`などのPaimonシステムテーブルのサポートが追加されました。ユーザーは`SELECT * FROM partition_table$files`のようなステートメントで基盤となるメタデータを直接クエリできるため、Paimonテーブルの探索、デバッグ、最適化がより簡単になります。

例えば、システムテーブルを使用してパーティションごとに追加された新しいデータファイルをカウントできます。

```SQL
SELECT
  partition,
  COUNT(*) AS new_file_count,
  SUM(file_size_in_bytes)/1024/1024 AS new_total_size_mb
FROM my_table$files
WHERE creation_time >= DATE_SUB(NOW(), INTERVAL 3 DAY)
GROUP BY partition
ORDER BY new_total_size_mb DESC;
```
3.1では、Paimonの依存関係がバージョン1.1.1にアップグレードされ、新機能をより良くサポートするようになりました。

Documentation: https://doris.apache.org/docs/lakehouse/catalogs/paimon-catalog

### Data Lakeクエリパフォーマンスの向上

Doris 3.1では、data lakeテーブル形式に対する包括的な最適化を追加し、実際の本番環境でより安定した効率的なdata lake分析を提供することを目指しています。

1. **Dynamic Partition Pruning**

複数テーブルの結合クエリにおいて、この機能は実行時に右側のテーブルからパーティション述語を生成し、左側のテーブルに適用します。不要なパーティションを動的に除外することで、データI/Oを削減し、クエリパフォーマンスを向上させます。Doris 3.0ではHiveテーブル用のdynamic partition pruningを導入しました。3.1では、この機能をIceberg、Paimon、Hudiテーブルに拡張しました。テストシナリオでは、高選択性のクエリで**30%〜40%のパフォーマンス向上**を示しました。

2. **Batch Split Scheduling**

lakehouseテーブルに大量のシャードが含まれている場合、従来Frontend（FE）はすべてのシャードメタデータを一度に収集し、Backend（BE）に送信していました。これにより、特に大規模データセットのクエリにおいて、FEメモリ消費量が多く、プランニング時間が長くなる可能性がありました。

バッチシャード実行は、シャードメタデータをバッチで生成し、生成されたものから実行することで、この問題を解決します。これによりFEメモリ負荷が軽減され、プランニングと実行を並行して実行でき、全体的な効率が向上します。Doris 3.0ではHiveテーブルでこの機能のサポートを追加し、3.1ではIcebergテーブルに拡張しました。大規模テストシナリオでは、FEメモリ使用量とクエリプランニング時間を大幅に削減しました。

### Federated Analytics：より柔軟で、より強力なコネクタ

3.1では、Dorisは外部データソースのコネクタプロパティを再構築しました。これにより、異なるメタデータサービスやストレージシステムとの統合が容易になり、サポートされる機能の範囲も拡張されました。

#### 1. より柔軟なData Lake Rest Catalogサポート

- **Iceberg REST Catalog**

	Iceberg REST Catalogのサポートを改善しました。Doris 3.1では、Unity、Polaris、Gravitino、Glueを含む複数のバックエンド実装で動作するようになりました。また、vended credentialsのサポートも追加し、より安全で柔軟な認証情報管理を可能にしました。AWSがサポートされており、GCPとAzureのサポートは今後のリリースで予定されています。

[documentation](https://doris.apache.org/docs/lakehouse/metastores/iceberg-rest)を参照してください

- **Paimon REST Catalog**

	Doris 3.1では、Alibaba Cloud DLF経由でのPaimon REST Catalogサポートを導入し、最新のDLFバージョンで管理されるPaimonテーブルに直接アクセスできるようになりました。

[documentation](https://doris.apache.org/docs/lakehouse/best-practices/doris-dlf-paimon)を参照してください

#### 2. より強力なHadoopエコシステムサポート

- **Multi-Kerberos環境サポート**

    Doris 3.1では、同一クラスタ内で複数のKerberos認証環境にアクセスできるようになりました。異なる環境では、個別のKDCサービス、Principal、Keytabを使用できます。Doris 3.1では、各Catalogを独立してKerberos設定で構成できるようになりました。この機能により、複数のKerberos環境を持つユーザーが、統一されたアクセス制御でDorisを通じてすべてを管理することがはるかに簡単になりました。

[documentation](https://doris.apache.org/docs/lakehouse/storages/hdfs#kerberos-authentication)を参照してください

- **Multi-Hadoop環境サポート**

    従来、Dorisはconfディレクトリの下に単一のHadoop設定（例：hive-site.xml、hdfs-site.xml）のみを配置することを許可していました。複数のHadoop環境と設定はサポートされていませんでした。Doris 3.1では、異なるHadoop設定ファイルを異なるCatalogに割り当てることができるようになり、外部データソースを柔軟に管理しやすくなりました。

[documentation](https://doris.apache.org/docs/lakehouse/storages/hdfs#kerberos-authentication)を参照してください

## 1. ストレージエンジンの改善

Doris 3.1では、パフォーマンスと安定性を向上させるため、ストレージレイヤーの改善を継続しました。

### Flexible Column Updates：新しいデータ更新体験

従来、Dorisの**Partial Column Update**機能では、単一のインポート内の各行で同じ列セットを更新する必要がありました。しかし、多くのシナリオでは、ソースシステムは主キーと更新される特定の列のみを含むレコードを提供し、異なる行で異なる列を更新します。これに対処するため、Dorisは**Flexible Column Update**機能を導入し、列ごとのデータを準備するユーザーの作業負荷を大幅に簡素化し、書き込みパフォーマンスを向上させました。

**使用方法**

- Merge-on-Write Uniqueテーブルを作成する際に有効化：
  -  `"enable_unique_key_skip_bitmap_column" = "true"`
- インポートモードを指定：
  -  `unique_key_update_mode: UPDATE_FLEXIBLE_COLUMNS`
- Dorisが自動的にflexible column updatesを処理し、不足データを補完します。

**例**

Flexible column updatesでは、同じインポートで異なる行が異なる列を更新できます：

- 行を削除（`DORIS_DELETE_SIGN`）
- 特定の列を更新（例：`v1`、`v2`、`v5`）
- 主キーと更新された列のみで新しい行を挿入；その他の列はデフォルト値または履歴データを使用。

**パフォーマンス**

- テスト環境：1 FE + 4 BE、16C 64GB、3億行×101列、3レプリカ
  - 1列のみ更新する20,000行をインポート（99列は自動補完）
  - 単一同時実行インポートパフォーマンス：10.4k行/秒
  - ノードあたりのリソース使用量：CPU ~60%、メモリ ~30GB、読み取りIOPS ~7.5k/s、書き込みIOPS ~5k/s

### Storage-Compute Separation：MOW Lock最適化

storage-compute separationシナリオでは、MOWテーブルのDelete Bitmapを更新するには分散ロック`delete_bitmap_update_lock`を取得する必要があります。従来、インポート、コンパクション、スキーマ変更操作がロック競合を起こし、高同時実行インポート時に長時間の待機や失敗を引き起こしていました。

大規模な同時データ取り込みをより安定して効率的にするため、いくつかの最適化を追加しました。これには**コンパクションロック時間の削減**が含まれ、高同時実行マルチタブレットインポートテストでp99コミット遅延を1.68分から49.4秒に短縮しました。また、待機しきい値を超えた後にトランザクションが強制ロックできるようにすることで、**ロングテールインポート遅延を削減**しました。

## 2. クエリパフォーマンスの向上

### Partition Pruningパフォーマンスとカバレッジの強化

Dorisは、独立して保存、クエリ、管理できるパーティションにデータを整理します。パーティション化により、クエリパフォーマンスが向上し、データ管理が最適化され、リソース消費が削減されます。クエリ中に、フィルタを適用して無関係なパーティションをスキップすること（partition pruningとして知られる）は、システムリソース使用量を削減しながらパフォーマンスを大幅に向上させることができます。

ログ分析やリスク制御システムなどのユースケースでは、単一テーブルに数万、時には数十万のパーティションが存在する可能性がありますが、ほとんどのクエリは数百のパーティションにのみアクセスします。したがって、効率的なpartition pruningはパフォーマンスにとって重要です。

3.1では、Dorisはpartition pruningのパフォーマンスと適用性の両方を大幅に向上させるいくつかの最適化を導入します：

- **Partition pruningのバイナリサーチ：** 時刻列に基づくパーティションについて、列値に従ってパーティションをソートすることで、partition pruningプロセスが最適化されました。これにより、pruning計算が線形スキャンからバイナリサーチに変更されます。DATETIMEパーティションフィールドを使用する136,000パーティションのシナリオでは、この最適化によりpruning時間が724ミリ秒から43ミリ秒に短縮され、16倍以上の高速化を実現しました。
- **Partition pruningで多数の単調関数のサポートを追加：** 実際のユースケースでは、時間パーティション列でのフィルタ条件は単純な論理比較ではなく、パーティション列での時間関連関数を含む複雑な式であることが多いです。例として、`to_date(time_stamp) > '2022-12-22'`、`date_format(timestamp,'%Y-%m-%d %H:%i:%s') > '2022-12-22 11:00:00'`などの式があります。Doris 3.1では、関数が単調である場合、Dorisはパーティション境界値を評価することで、パーティション全体をpruningできるかどうかを判定できます。そして、Doris 3.1では既にCASTと25の一般的に使用される時間関連関数をサポートしており、時間パーティション列でのフィルタ条件の大部分をカバーしています。
- **フルパスコード最適化：** さらに、Doris 3.1では、partition pruningコードパス全体がコードレベルで徹底的に最適化され、不要なオーバーヘッドが排除されました。

### Data Traits：最大10倍のパフォーマンス向上

Doris 3.1では、オプティマイザがdata traitsをより賢く活用してクエリパフォーマンスを向上させることができます。クエリプラン内の各ノードを分析してUNIQUE、UNIFORM、EQUAL SETなどのdata traitsを収集し、列間の関数従属性を推論します。ノードのデータが特定のtraitsを満たす場合、Dorisは不要な結合、集計、またはソートを除去し、パフォーマンスを大幅に向上させることができます。

これらの最適化を活用するよう設計されたテストケースでは、data traitsの活用により**10倍以上のパフォーマンス向上**を実現しました。詳細は下表を参照してください：

| **最適化**                                           | **最適化後**  | **最適化前**      | **パフォーマンス向上** |
| :--------------------------------------------------- | :------------ | :---------------- | :-------------------- |
| ユニーク結合キーに基づく結合の除去                   | 50 ms         | 100 ms            | 100%                  |
| ユニーク性を利用した冗長集計キーの除去               | 80 ms         | 960 ms            | 1100%                 |
| 関数従属性による集計キーの除去                       | 1410 ms       | 2110 ms           | 50%                   |
| 均一列での集計キーの除去                             | 110 ms        | 150 ms            | 36%                   |
| 不要なソートの除去                                   | 130 ms        | 370 ms            | 185%                  |

## 6. 機能改善

### 半構造化データ

**VARIANT**

- `variant_type(x)`関数を追加：Variantサブフィールドの現在の実際の型を返します。
- ComputeSignature/Helperを追加して、関数パラメータと戻り値の型の推論能力を向上。パラメータと戻り値の型推論を改善。

**STRUCT**

- Schema ChangeがSTRUCT型へのサブカラム追加をサポートするようになりました。

#### Lakehouse

- Catalogレベルでメタデータキャッシュポリシー（例：キャッシュ有効期限）の設定をサポートし、データの鮮度とメタデータアクセスパフォーマンスのバランスを取るためのより大きな柔軟性をユーザーに提供します。

[documentation](https://doris.apache.org/docs/lakehouse/meta-cache)を参照してください

- `FILE()` Table Valued Functionのサポートを追加し、既存の`S3()`、`HDFS()`、`LOCAL()`関数を単一のインターフェースに統合して使いやすさと理解しやすさを向上させました。

[documentation](https://doris.apache.org/docs/dev/sql-manual/sql-functions/table-valued-functions/file)を参照してください

### 集計演算子機能の強化

Doris 3.1では、オプティマイザは集計演算子の改善に焦点を当て、広く使用される2つの機能のサポートを追加しました。

**非標準GROUP BYサポート**

SQL標準では、select list、`HAVING`条件、または`ORDER BY`リストが`GROUP BY`句で指定されていない非集計列を参照するクエリは許可されません。しかし、MySQLでは、SQL_MODEに"ONLY_FULL_GROUP_BY"が含まれていない場合、制限はありません。詳細はMySQLドキュメントを参照してください：https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html#sqlmode_only_full_group_by

`ONLY_FULL_GROUP_BY`を無効にする効果は、非集計列で`ANY_VALUE`を使用することと同等です。例：

```SQL
-- Non-standard GROUP BY
SELECT c1, c2 FROM t GROUP BY c1
-- Equal to
SELECT c1, any_value(c2) FROM t GROUP BY c1
```
3.1では、Dorisは以前の動作に合わせて、デフォルトで"ONLY_FULL_GROUP_BY"を有効にします。非標準のGROUP BY機能を使用するには、ユーザーは以下の設定で有効にできます：

```SQL
set sql_mode = replace(@@sql_mode, 'ONLY_FULL_GROUP_BY', '');
```
**複数の DISTINCT 集約のサポート**

以前のバージョンでは、集約クエリが異なるパラメータを持つ複数の DISTINCT 集約関数を含み、それらの DISTINCT セマンティクスが非 DISTINCT セマンティクスと異なり、かつ以下のいずれでもない場合、Doris はクエリを実行できませんでした：

- 単一パラメータの COUNT
- SUM
- AVG
- GROUP_CONCAT

Doris 3.1 では、この領域が大幅に強化されました。現在、複数の distinct 集約を含むクエリは正しく実行され、期待される結果を返すことができます。例えば：

```SQL
SELECT count(DISTINCT c1,c2), count(DISTINCT c2,c3), count(DISTINCT c3) FROM t;
```
## 7. 動作変更

**VARIANT**

- `variant_max_subcolumns_count`制約
  - 単一のテーブルでは、すべてのVariantカラムが同じ`variant_max_subcolumns_count`値を持つ必要があります：すべて0またはすべて0より大きい値。値を混在させると、テーブル作成やスキーマ変更時にエラーが発生します。
- 新しいVariantの読み取り/書き込み/serdeおよびコンパクションパスは、古いデータとの後方互換性があります。古いVariantバージョンからのアップグレードでは、クエリ出力にわずかな違いが生じる可能性があります（例：余分なスペースや.区切り文字によって作成される追加レベル）。
- Variantデータ型にinverted indexを作成すると、データフィールドのいずれもインデックス条件を満たさない場合、空のインデックスファイルが生成されます。これは期待される動作です。

**権限**

- SHOW TRANSACTIONに必要な権限が変更されました：ADMIN_PRIVの代わりに、対象データベースでのLOAD_PRIVが必要になりました。
- SHOW FRONTENDS / BACKENDSとNODE RESTful APIは同じ権限を使用するようになりました。これらのインターフェースは、information_schemaデータベースでのSELECT_PRIVが必要になりました。

**Apache Doris 3.1を始めよう**

バージョン3.1の正式リリース前でも、半構造化データとデータレイクの複数の機能が実際の本番環境で検証されており、期待されるパフォーマンス向上を示しています。関連するニーズを持つユーザーには、新しいバージョンをお試しいただくことをお勧めします：

**[GitHubでApache Doris 3.1をダウンロード](https://github.com/apache/doris/releases)** 

**[公式ウェブサイトからダウンロード](https://doris.apache.org/download)** 

**謝辞**

このリリースの開発、テスト、フィードバック提供に貢献していただいたすべてのコントリビューターに心から感謝いたします：

@924060929 @airborne12 @amorynan @BePPPower @BiteTheDDDDt @bobhan1 @CalvinKirs @cambyzju @cjj2010 @csun5285 @DarvenDuan @dataroaring @deardeng @dtkavin @dwdwqfwe @eldenmoon @englefly @feifeifeimoon @feiniaofeiafei @felixwluo @freemandealer @Gabriel39 @gavinchou @ghkang98 @gnehil @gohalo @HappenLee @heguanhui @hello-stephen @HonestManXin @htyoung @hubgeter @hust-hhb @jacktengg @jeffreys-cat @Jibing-Li @JNSimba @kaijchen @kaka11chen @KeeProMise @koarz @liaoxin01 @liujiwen-up @liutang123 @luwei16 @MoanasDaddyXu @morningman @morrySnow @mrhhsg @Mryange @mymeiyi @nsivarajan @qidaye @qzsee @Ryan19929 @seawinde @shuke987 @sollhui @starocean999 @suxiaogang223 @SWJTU-ZhangLei @TangSiyang2001 @Vallishp @vinlee19 @w41ter @wangbo @wenzhenghu @wumeibanfa @wuwenchi @wyxxxcat @xiedeyantu @xinyiZzz @XLPE @XnY-wei @XueYuhai @xy720 @yagagagaga @Yao-MR @yiguolei @yoock @yujun777 @Yukang-Lian @Yulei-Yang @yx-keith @Z-SWEI @zclllyybb @zddr @zfr9527 @zgxme @zhangm365 @zhangstar333 @zhaorongsheng @zhiqiang-hhhh @zy-kkk @zzzxl1993
