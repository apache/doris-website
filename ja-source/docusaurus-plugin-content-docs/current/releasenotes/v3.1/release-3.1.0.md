---
{
  "title": "リリース 3.1.0",
  "language": "ja",
  "description": "Apache Doris 3.1の正式リリースを発表できることを嬉しく思います。"
}
---
**Apache Doris 3.1**の正式リリースを発表できることを嬉しく思います。半構造化データとlakehouse分析をより強力で実用的にするマイルストーンバージョンです。

Doris 3.1では**VARIANT データタイプ用のsparse columnsとschema template**を導入し、ユーザーは数万の動的フィールドを持つデータセットを効率的に格納、インデックス化、クエリできるようになります。これはログ、イベント、JSON中心のワークロードに最適です。

lakehouse機能については、Doris 3.1はlakehouseにより良い**asynchronous materialized view**を導入し、データレイクとデータウェアハウス間のより強固な橋渡しを構築します。また、**IcebergとPaimon**のサポートも拡張し、複雑なlakehouseワークロードの管理をより簡単で効率的にします。

Apache Doris 3.1の開発中に**90名以上のcontributors**が**1,000を超える改善と修正**を提出しました。開発、テスト、フィードバックを通じて貢献していただいたすべての方に心からの感謝を送りたいと思います。

**[GitHub上でApache Doris 3.1をダウンロード](https://github.com/apache/doris/releases)**

**[公式ウェブサイトからダウンロード](https://doris.apache.org/download)**

### Apache Doris 3.1の主なハイライト

- **半構造化データ分析**
  - VARIANTタイプ用の**Sparse columns**、数万のサブカラムをサポート
  - VARIANT用の**Schema template**、柔軟性を失うことなく、より高速なクエリ、より安定したインデックス化、制御可能なコストを実現
  - **Inverted Indexes Storage Format**をV2からV3にアップグレード、ストレージ使用量を最大**20%**削減
  - 3つの新しいtokenizer：**ICU Tokenizer**、**IK Tokenizer**、**Basic Tokenizer**。また、**custom tokenizers**のサポートも追加し、多様なシナリオでの検索再現率を大幅に改善
- **レイクハウスアップグレード**
  - **より良いmaterialized views機能**をデータレイクに導入し、データレイクとデータウェアハウス間の橋渡しを強化
  - **Iceberg**と**Paimon**のより幅広いサポート
  - **Dynamic partition pruning**と**batch splits scheduling**により、特定のクエリワークロードを最大**40%**改善し、FE（frontend）メモリ消費を削減
  - Doris 3.1は**external data sourcesの接続プロパティ**をリファクタリングし、様々なmetadata servicesとstorage systemsとの統合をより明確にし、より柔軟な接続オプションを提供
- **Storage Engineの改善**
  - **新しいflexible column updates**、partial column updatesに基づき、単一のimport内で各行に対して異なるカラムを更新可能
  - storage-compute分離シナリオにおいて、Doris 3.1は**MOW tables**のロックメカニズムを最適化し、高並行データ取り込みのエクスペリエンスを改善
- **パフォーマンスの最適化**
  - Doris 3.1は**partition pruningとquery planning**を強化し、大規模なパーティション（数万）と複雑なフィルタリング式でより高速なクエリと低いリソース使用量を実現
  - optimizerは**data-aware optimization techniques**も導入し、特定のワークロードで最大**10倍のパフォーマンス向上**を達成

## 1. VARIANT半構造化データ分析が大幅アップグレード

### ストレージ機能：Sparse columnsとSubcolumns Vertical Compaction

従来のOLAPシステムは数千から数万のカラムを含む「super-wide tables」に苦戦することが多く、メタデータの肥大化、compaction増幅、クエリパフォーマンスの劣化に直面していました。**Doris 3.1**はVARIANTタイプ用の**sparse subcolumns**と**subcolumn-levelのvertical compaction**でこれに対処し、実用的なカラム限界を数万まで押し上げます。

**VARIANTはストレージ層での徹底的な最適化により以下のメリットをもたらします：**

- columnar storageでの**subcolumns（数千から数万）の安定したサポート**、よりスムーズなクエリとcompactionレイテンシーの削減を実現
- **制御可能なメタデータとインデックス化**、指数関数的な増大を防止
- 実世界のテストで**10,000を超えるsubcolumnsのSubcolumnarization**（columnar storage）が達成可能で、スムーズで効率的なcompactionパフォーマンス

**ultra-wide tablesの主な使用例：**

- **Connected Vehicles / IoTテレメトリ：** 様々なデバイスモデルと動的に変化するセンサー次元をサポート
- **Marketing Automation / CRM：** 継続的に拡張するイベントとユーザー属性（例：カスタムイベント/プロパティ）
- **広告 / Event Tracking：** sparseで継続的に進化するフィールドを持つ大量のオプショナルプロパティ
- **セキュリティ監査 / ログ：** 多様なログソースが様々なフィールドを持ち、スキーマ別に集約・検索する必要がある
- **Eコマース商品属性：** 非常に変動的な商品属性を持つ幅広いカテゴリ範囲

**動作原理：**

- **頻繁なJSONキーが実際のカラムになる**

	最も一般的なJSONキーを真のcolumnar subcolumnsとして自動的に保持します。これによりクエリを高速に保ち、メタデータを小さく維持します。稀なキーはコンパクトな「sparse」領域に留まるため、テーブルが肥大化しません。

- **subcolumns用のスマートで低メモリのmerges**

	VARIANT subcolumnsを小さなverticalグループでmergeし、メモリ使用量を大幅に削減し、数千のフィールドがあってもbackground maintenanceをスムーズに保ちます。ホットキーは検出され、自動的にsubcolumnsに昇格されます。

- **missing valuesのより高速な処理**

	デフォルト値をバッチで埋めることで、読み取りとmerge時の行毎のオーバーヘッドを削減します。

- **LRUキャッシングによるleanメタデータ**

	カラムメタデータはLRUポリシーでキャッシュされ、メモリ使用量を削減し、繰り返しアクセスを高速化します。要約すると：重要なフィールドに対してcolumnarスピードを得られ、long tailに対する重いコストを支払うことなく、background操作はスムーズで予測可能なままです。

**有効化と使用方法：**

新しいカラムレベルのVariantパラメータ制御、カラムプロパティ：

`variant_max_subcolumns_count`：デフォルトは`0`で、sparse subcolumnサポートが無効であることを意味します。特定の値に設定すると、システムは最も頻繁なTop-N JSONキーをcolumnar storage用に抽出し、残りのキーはsparseに格納されます。

```SQL
-- Enable sparse subcolumns and cap hot subcolumn count
CREATE TABLE IF NOT EXISTS tbl (
  k BIGINT,
  v VARIANT<
      properties("variant_max_subcolumns_count" = "2048") -- pick top-2048 hot keys
  >
) DUPLICATE KEY(k);
```
### Schema Templates

Schema templatesは、重要なパス上で常に変化するJSONを予測可能にします。これによりクエリの実行速度が向上し、インデックスが安定し、柔軟性を失うことなくコストを制御できます。利点は以下のとおりです：

- **型の安定性**: DDLで主要なJSONサブパスの型をロックし、クエリエラー、インデックス無効化、暗黙的キャストのオーバーヘッドを引き起こす型のドリフトを防ぎます。
- **より高速で正確な検索**: サブパスごとに転置インデックス戦略（トークン化/非トークン化、パーサー、フレーズ検索）を調整し、レイテンシを削減してヒット率を向上させます。
- **制御されたインデックスとコスト**: 列全体をインデックス化する代わりに、サブパスごとにインデックスを調整し、インデックス数、書き込み増幅、ストレージ使用量を大幅に削減します。
- **保守性とコラボレーション**: JSONの「データコントラクト」として機能し、チーム間でセマンティクスの一貫性を保ちます。型とインデックスの状態を観察・デバッグしやすくなります。
- **進化の容易さ**: ホットパスをテンプレート化し、オプションでインデックス化する一方で、ロングテールフィールドは柔軟性を保つことで、予期せぬ問題なくスケールできます。

**有効化と使用方法:**

- `VARIANT<...>`内で共通のサブパスと型（ワイルドカードを含む）を明示的に宣言します。例：`VARIANT<'a': INT, 'c.d': TEXT, 'array_int_*': ARRAY<INT>>`。
- 差別化された戦略（`field_pattern`、`parsers`、`tokenization`、`phrase`検索）でサブパスごとのインデックスを設定し、ワイルドカードを使用してフィールドファミリーを一度にカバーします。
- 新しい列プロパティ：`variant_enable_typed_paths_to_sparse`
- デフォルト：`false`（型付けされた事前定義パスはスパースに格納されません）。
- 型付けパスもスパース候補として扱う場合はtrueに設定します。多くのパスがマッチし、列の拡散を避けたい場合に有用です。

要約すると：重要なものをテンプレート化し、正確にインデックス化し、それ以外のものは柔軟性を保つということです。

**例1:** 単一列に複数インデックスを持つスキーマ定義

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
**例2:** ワイルドカードパターンに一致する列のバッチ処理

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
**例3:** 事前定義された型付きカラムをスパースに格納することを許可する

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
## 1. Inverted Index Storage Format V3

V2と比較して、Inverted Index V3はストレージをさらに最適化します：

- より小さなインデックスファイルにより、ディスク使用量とI/Oオーバーヘッドが削減されます。
- httplogsおよびlogsbenchデータセットでのテストでは、V3で最大20%のストレージ容量削減が示されており、大規模テキストデータやログ解析シナリオに最適です。

| Test dataSet | Data size before import | inverted_index_storage_format = v2 | inverted_index_storage_format = v3 | Space saving: V3 vs. V2 |
| :----------- | :---------------------- | :--------------------------------- | :--------------------------------- | :---------------------- |
| httplogs     | 30.89 GB                | 4.472 GB                           | 3.479 GB                           | 22.2%                   |
| logsbench    | 1479.31 GB              | 182.180 GB                         | 138.008 GB                         | 24.2%                   |

**主要な改善点：**

- **転置インデックス用語辞書にZSTD辞書圧縮を導入**。インデックスプロパティの`dict_compression`で有効化されます。
- **転置インデックス内の各用語に関連付けられた位置情報の圧縮を追加**し、ストレージフットプリントをさらに削減します。

**使用方法：**

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

Doris 3.1では、多様なトークン化のニーズにより良く対応するため、新しく一般的に使用されるtokenizerを追加しました：

1. **ICU Tokenizer:**

- **実装:** International Components for Unicode (ICU) に基づいています。
- **使用例:** 複雑な文字体系や多言語ドキュメントを含む国際化されたテキストに最適です。
- **例:**

```SQL
SELECT TOKENIZE('مرحبا بالعالم Hello 世界', '"parser"="icu"');
-- Results: ["مرحبا", "بالعالم", "Hello", "世界"]

SELECT TOKENIZE('มนไมเปนไปตามความตองการ', '"parser"="icu"');
-- Results: ["มน", "ไมเปน", "ไป", "ตาม", "ความ", "ตองการ"]
```
2. **Basic Tokenizer**

- **実装**: 基本的な文字タイプ認識を使用した、シンプルなルールベースのカスタムtokenizer。
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

新しい**カスタムトークン化**機能により、ユーザーはニーズに応じてトークン化ロジックを設計でき、テキスト検索の再現率を向上させることができます。

文字フィルタ、トークナイザ、およびトークンフィルタを組み合わせることで、ユーザーは組み込みアナライザの制限を超えて、テキストを検索可能な用語にどのように分割するかを正確に定義でき、検索の関連性と分析精度の両方に直接影響を与えることができます。

![Custom Tokenization](/images/release-3.1/custom-tokenization.png)

**使用例**

- **問題**: デフォルトのUnicodeトークナイザでは、「13891972631」のような電話番号は単一のトークンとして扱われ、前方一致検索（例：「138」）が不可能になります。
- **解決策**:
  - **Edge N-gram**カスタムトークナイザを使用してトークナイザを作成します：
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
- Edge N-gram tokenizerを使用することで、電話番号は複数のプレフィックストークンに分割され、柔軟なプレフィックスマッチング検索が可能になります。

## 3. Lakehouse機能のアップグレード

### 非同期マテリアライズドビューがデータレイクを完全サポート

バージョン3.1では、非同期マテリアライズドビューが大幅に強化され、パーティションレベルの増分メンテナンスとパーティションレベルの透過的クエリ書き換えを包括的にサポートするようになりました。この機能は、Iceberg、Paimon、Hudiなどのデータレイク形式で利用できます。

Dorisはバージョン2.1で非同期マテリアライズドビューを導入し、以下を含む継続的な改善を行ってきました：

| 機能               | 説明                                                  |
| :-------------------- | :----------------------------------------------------------- |
| Refresh               | 内部テーブルとHiveテーブルに対する完全およびパーティションレベルの増分メンテナンス |
| Trigger Methods       | 全タイプのテーブルに対するスケジュール更新、手動更新、および内部テーブルのみに対するコミットによる更新 |
| partitioning          | ベーステーブルと同じパーティショニング。パーティションローリング、多階層パーティション、ベーステーブルの特定の「ホット」パーティション保持などの機能を含む |
| Transparent Rewriting | 内部テーブルに対する条件補償、結合の書き換えと導出、集約の書き換え、パーティション補償をサポート |
| Maintenance Tools     | マテリアライズドビューの実行時情報を照会するためのtasks()、jobs()、mv_infos()を提供 |

バージョン3.1では、外部テーブルに対するパーティションレベルの増分メンテナンスとクエリ書き換え時のパーティションレベル補償を包括的にサポートすることで、lakehouse機能の強化に焦点を当てています。この強化は、Iceberg、Paimon、Hudiなどの主要なデータレイクテーブル形式を対象とし、データレイクとデータウェアハウス間の高速データブリッジを効果的に構築します。サポート範囲の詳細は以下の表に示されています。

**具体的なサポート詳細は以下を参照してください：**

| External Source | Partition Refresh                                            | Transparent Partition Rewriting |
| :-------------- | :----------------------------------------------------------- | :------------------------------ |
| Hive            | サポート                                                    | サポート                       |
| Iceberg         | サポート                                                    | サポート                       |
| Paimon          | サポート                                                    | サポート                       |
| Hudi            | パーティション同期を検出できません；特定のパーティションを手動で更新する場合に適しています | サポート                       |

### IcebergとPaimonのサポート強化

#### 1. Iceberg

Doris 3.1では、Icebergテーブル形式に対する幅広い最適化と機能強化を導入し、最新のIceberg機能との互換性を提供します。

**Branch / Tagライフサイクル管理**

3.1以降、DorisはIceberg BranchesとTagsの作成、削除、読み取り、書き込みをネイティブにサポートしています。Gitと同様に、これによりユーザーはIcebergテーブルデータのバージョンをシームレスに管理できます。この機能により、ユーザーは外部エンジンやカスタムロジックに依存することなく、並列バージョン管理、カナリアリリース、環境分離を実行できます。

```SQL
-- Create branches
ALTER TABLE iceberg_tbl CREATE BRANCH b1;
-- Write data to a specific branch
INSERT INTO iceberg_tbl@branch(b1) values(1, 2);
-- Query data from a specific branch
SELECT * FROM iceberg_tbl@branch(b1);
```
**包括的なシステムテーブルサポート**

Doris 3.1では、`$entries`、`$files`、`$history`、`$manifests`、`$refs`、`$snapshots`などのIcebergシステムテーブルのサポートが追加されました。ユーザーは`SELECT * FROM iceberg_table$history`や`…$refs`などのコマンドでIcebergを直接クエリして、メタデータ、スナップショット履歴、ブランチ/タグマッピング、ファイル構成を調査できます。これによりメタデータの観測性が劇的に向上し、問題診断、パフォーマンスチューニング、ガバナンスがより透明になります。

`SELECT * FROM iceberg_table$history`や`…$refs`などのステートメントを使用して、Icebergの基盤となるメタデータ、スナップショットリスト、ブランチ、タグ情報を直接クエリできます。これにより、データファイルの構成、スナップショット変更の履歴、ブランチマッピングについて深い洞察を得ることができます。この機能によりIcebergメタデータの観測性が大幅に向上し、問題のトラブルシューティング、最適化分析の実行、ガバナンス決定がより簡単で透明になります。

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
**Iceberg View のクエリサポート**

Doris 3.1 では Iceberg 論理ビューへのアクセスとクエリのサポートが追加され、Doris の Iceberg 機能がさらに強化されました。今後の 3.x リリースでは、Iceberg Views の SQL 方言変換サポートを追加する予定です。

**ALTER 文によるスキーマ進化**

3.1 以降、Doris は ALTER TABLE 文を通じて Iceberg テーブルでの列の追加、削除、名前変更、並び替えをサポートします。これにより、Spark のようなサードパーティエンジンを必要とせずに Doris が Iceberg テーブルを管理する能力がさらに向上しました。

```SQL
ALTER TABLE iceberg_table
ADD COLUMN new_col int;
```
さらに、バージョン3.1では、新しいIcebergの機能をより良くサポートするため、Icebergの依存関係がバージョン1.9.2にアップグレードされました。今後の3.1.xリリースでは、データコンパクションやブランチ進化を含むIcebergテーブル管理がさらに改善される予定です。

ドキュメント: https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog

#### 2. Paimon

Doris 3.1では、実際の使用ケースに基づいて、Paimonテーブル形式にいくつかのアップデートと拡張をもたらします。

**Paimonバッチ増分クエリのサポート**

Doris 3.1では、Paimonテーブル内の2つの指定されたスナップショット間の増分データを読み取ることができます。これにより、ユーザーはPaimon増分データにより良くアクセスでき、特にPaimonテーブルでの増分集計マテリアライズドビューが可能になります。

```SQL
SELECT * FROM paimon_tbl@incr('startSnapshotId'='2', 'endSnapshotId'='5');
```
**ブランチとタグの読み取り**

3.1以降、DorisはPaimonテーブルデータをブランチとタグから読み取ることをサポートし、より柔軟なマルチバージョンデータアクセスを提供します。

```SQL
SELECT * FROM paimon_tbl@branch(branch1);
SELECT * FROM paimon_tbl@tag(tag1);
```
**包括的なシステムテーブルサポート**

Icebergと同様に、3.1では`$files`、`$partitions`、`$manifests`、`$tags`、`$snapshots`などのPaimonシステムテーブルのサポートが追加されました。ユーザーは`SELECT * FROM partition_table$files`のようなステートメントで基盤となるメタデータを直接クエリできるため、Paimonテーブルの探索、デバッグ、最適化が容易になります。

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
3.1では、Paimonの依存関係がバージョン1.1.1にアップグレードされ、新機能をより適切にサポートします。

ドキュメント: https://doris.apache.org/docs/lakehouse/catalogs/paimon-catalog

### データレイククエリパフォーマンスの向上

Doris 3.1では、データレークテーブルフォーマットに対する包括的な最適化を追加し、実際の本番環境でより安定的で効率的なデータレーク分析を提供することを目指しています。

1. **動的パーティション剪定**

複数テーブルの結合クエリにおいて、この機能は実行時に右側のテーブルからパーティション述語を生成し、それを左側のテーブルに適用します。不要なパーティションを動的に剪定することで、データI/Oを削減し、クエリパフォーマンスを向上させます。Doris 3.0ではHiveテーブルに対する動的パーティション剪定を導入しました。3.1では、この機能をIceberg、Paimon、Hudiテーブルに拡張しました。テストシナリオでは、高い選択性を持つクエリで**30%～40%のパフォーマンス向上**を示しました。

2. **バッチ分割スケジューリング**

レイクハウステーブルが大量のシャードを含む場合、Frontend（FE）は従来、すべてのシャードメタデータを一度に収集し、Backend（BE）に送信していました。これにより、特に大規模データセットでのクエリにおいて、FEメモリ消費量の増加と長い計画時間が発生する可能性があります。

バッチシャード実行は、シャードメタデータをバッチで生成し、生成されたものから実行することで、この問題を解決します。これにより、FEメモリ負荷が軽減され、計画と実行の並列実行が可能になり、全体的な効率が向上します。Doris 3.0ではHiveテーブルでこの機能のサポートを追加し、3.1ではIcebergテーブルに拡張しました。大規模テストシナリオでは、FEメモリ使用量とクエリ計画時間を大幅に削減しました。

### 統合分析: より柔軟で、より強力なコネクタ

3.1では、Dorisは外部データソース向けのコネクタプロパティを再構築しました。これにより、異なるメタデータサービスとストレージシステムとの統合が容易になり、サポートされる機能の範囲も拡張されます。

#### 1. より柔軟なデータレイクRest Catalogサポート

- **Iceberg REST Catalog**

	Iceberg REST Catalogのサポートを改善しました。Doris 3.1は現在、Unity、Polaris、Gravitino、Glueを含む複数のバックエンド実装と連携します。また、vended credentialsのサポートを追加し、より安全で柔軟な認証情報管理を可能にしました。AWSをサポートしており、GCPとAzureのサポートは今後のリリースで予定されています。

[ドキュメント](https://doris.apache.org/docs/lakehouse/metastores/iceberg-rest)を参照してください

- **Paimon REST Catalog**

	Doris 3.1では、Alibaba Cloud DLF経由でのPaimon REST Catalogのサポートを導入し、最新のDLFバージョンで管理されるPaimonテーブルへの直接アクセスを可能にします。

[ドキュメント](https://doris.apache.org/docs/lakehouse/best-practices/doris-dlf-paimon)を参照してください

#### 2. より強力なHadoopエコシステムサポート

- **マルチKerberos環境サポート**

    Doris 3.1では、同一クラスタ内で複数のKerberos認証環境へのアクセスが可能です。異なる環境では、個別のKDCサービス、Principal、Keytabを使用できます。Doris 3.1では、各Catalogを独立してそれぞれのKerberos設定で構成できるようになりました。この機能により、複数のKerberos環境を持つユーザーが、統一されたアクセス制御でDorisを通じてそれらすべてを管理することが格段に容易になります。

[ドキュメント](https://doris.apache.org/docs/lakehouse/storages/hdfs#kerberos-authentication)を参照してください

- **マルチHadoop環境サポート**

    以前は、Dorisはconfディレクトリの下に単一のHadoop構成（例：hive-site.xml、hdfs-site.xml）のみを配置することができました。複数のHadoop環境と構成はサポートされていませんでした。Doris 3.1では、ユーザーは異なるCatalogに異なるHadoop構成ファイルを割り当てることができ、外部データソースの柔軟な管理が容易になります。

[ドキュメント](https://doris.apache.org/docs/lakehouse/storages/hdfs#kerberos-authentication)を参照してください

## 1. ストレージエンジンの改善

Doris 3.1では、ストレージ層の改善を継続し、パフォーマンスと安定性を向上させました。

### 柔軟なカラム更新: 新しいデータ更新エクスペリエンス

従来、Dorisの**部分カラム更新**機能では、単一のインポートで各行が同じカラムセットを更新する必要がありました。しかし、多くのシナリオでは、ソースシステムはプライマリキーと更新対象の特定のカラムを含むレコードのみを提供し、異なる行が異なるカラムを更新します。この問題に対処するため、Dorisは**柔軟なカラム更新**機能を導入し、ユーザーのカラム別データ準備の作業負荷を大幅に簡素化し、書き込みパフォーマンスを向上させました。

**使用方法**

- Merge-on-Write Uniqueテーブルの作成時に有効化:
  -  `"enable_unique_key_skip_bitmap_column" = "true"`
- インポートモードの指定:
  -  `unique_key_update_mode: UPDATE_FLEXIBLE_COLUMNS`
- Dorisが柔軟なカラム更新を自動的に処理し、不足データを補完します。

**例**

柔軟なカラム更新により、同一インポートで異なる行が異なるカラムを更新できます:

- 行の削除（`DORIS_DELETE_SIGN`）
- 特定カラムの更新（例：`v1`、`v2`、`v5`）
- プライマリキーと更新カラムのみで新しい行を挿入；他のカラムはデフォルト値または履歴データを使用。

**パフォーマンス**

- テスト環境: 1 FE + 4 BE、16C 64GB、300M行 × 101カラム、3レプリカ
  - わずか1カラムを更新する20,000行をインポート（99カラムは自動補完）
  - 単一並行インポートパフォーマンス: 10.4k行/秒
  - ノード当たりのリソース使用量: CPU ~60%、メモリ ~30GB、読み取りIOPS ~7.5k/s、書き込みIOPS ~5k/s

### ストレージ・コンピューティング分離: MOWロック最適化

ストレージ・コンピューティング分離シナリオでは、MOWテーブルでDelete Bitmapを更新するには分散ロック`delete_bitmap_update_lock`の取得が必要です。従来、インポート、コンパクション、スキーマ変更操作がロックを競合し、高並行インポート下で長時間の待機や失敗が発生していました。

大規模で並行なデータ取り込みをより安定的で効率的にするため、いくつかの最適化を追加しました。これには**コンパクションロック時間の短縮**が含まれ、高並行マルチタブレットインポートテストでp99コミット遅延を1.68分から49.4秒に短縮しました。また、待機閾値を超えた後にトランザクションが強制ロックを可能にすることで、**ロングテールインポート遅延を削減**しました。

## 2. クエリパフォーマンスの向上

### パーティション剪定パフォーマンスとカバレッジの強化

Dorisは、独立して保存、クエリ、管理できるパーティションにデータを整理します。パーティショニングは、クエリパフォーマンスを向上させ、データ管理を最適化し、リソース消費を削減します。クエリ中に、無関係なパーティションをスキップするフィルタの適用（パーティション剪定として知られる）は、システムリソース使用量を削減しながら、パフォーマンスを大幅に向上させることができます。

ログ分析やリスク制御システムなどの使用事例では、単一テーブルが数万、場合によっては数十万のパーティションを持つことがありますが、ほとんどのクエリは数百のパーティションのみにアクセスします。したがって、効率的なパーティション剪定はパフォーマンスにとって重要です。

3.1では、Dorisはパーティション剪定のパフォーマンスと適用性を大幅に強化するいくつかの最適化を導入します:

- **パーティション剪定のためのバイナリサーチ:** 時間カラムに基づくパーティションについて、カラム値に従ってパーティションをソートすることで、パーティション剪定プロセスが最適化されました。これにより、剪定計算が線形スキャンからバイナリサーチに変更されます。DATETIME パーティションフィールドを使用した136,000パーティションのシナリオでは、この最適化により剪定時間が724ミリ秒から43ミリ秒に短縮され、16倍以上の高速化を実現しました。
- **パーティション剪定での大量の単調関数のサポート追加:** 実際の使用事例では、時間分割カラムでのフィルタ条件は、単純な論理比較ではなく、パーティションカラムに対する時間関連関数を含む複雑な式であることが多くあります。例として、`to_date(time_stamp) > '2022-12-22'`、`date_format(timestamp,'%Y-%m-%d %H:%i:%s') > '2022-12-22 11:00:00'`などの式があります。Doris 3.1では、関数が単調である場合、Dorisはパーティション境界値を評価することで、パーティション全体が剪定可能かどうかを判断できます。そして、Doris 3.1では既にCASTと25の一般的に使用される時間関連関数をサポートしており、時間分割カラムでのフィルタ条件の大部分をカバーしています。
- **全パスコード最適化:** さらに、Doris 3.1では、不要なオーバーヘッドを排除するため、パーティション剪定のコードパス全体がコードレベルで徹底的に最適化されました。

### データ特性: 最大10倍のパフォーマンス向上

Doris 3.1では、オプティマイザはデータ特性をより賢く利用してクエリパフォーマンスを向上させることができます。クエリプランの各ノードを分析してUNIQUE、UNIFORM、EQUAL SETなどのデータ特性を収集し、カラム間の関数従属性を推論します。ノードのデータが特定の特性を満たす場合、Dorisは不要な結合、集約、ソートを排除し、パフォーマンスを大幅に向上させることができます。

これらの最適化を活用するよう設計されたテストケースでは、データ特性の活用により**10倍以上のパフォーマンス向上**を実現しました。詳細は以下の表を参照してください:

| **最適化**                                 | **最適化済み** | **未最適化** | **パフォーマンス向上** |
| :----------------------------------------- | :------------- | :----------- | :--------------------- |
| 一意結合キーに基づく結合の排除             | 50 ms          | 100 ms       | 100%                   |
| 一意性を使用した冗長な集約キーの削除       | 80 ms          | 960 ms       | 1100%                  |
| 関数従属性による集約キーの削除             | 1410 ms        | 2110 ms      | 50%                    |
| 均一カラムでの集約キーの削除               | 110 ms         | 150 ms       | 36%                    |
| 不要なソートの排除                         | 130 ms         | 370 ms       | 185%                   |

## 6. 機能改善

### 半構造化データ

**VARIANT**

- `variant_type(x)`関数を追加: Variantサブフィールドの現在の実際の型を返します。
- ComputeSignature/Helperを追加し、関数パラメータと戻り値型の推論能力を向上させました。

**STRUCT**

- スキーマ変更でSTRUCT型へのサブカラム追加をサポートするようになりました。

#### レイクハウス

- Catalogレベルでのメタデータキャッシュポリシー（例：キャッシュ有効期限）の設定をサポートし、データの新鮮性とメタデータアクセスパフォーマンスのバランスをより柔軟に調整できるようになりました。

[ドキュメント](https://doris.apache.org/docs/lakehouse/meta-cache)を参照してください

- `FILE()` Table Valued Functionのサポートを追加し、既存の`S3()`、`HDFS()`、`LOCAL()`関数を単一のインターフェースに統一し、使いやすさと理解しやすさを向上させました。

[ドキュメント](https://doris.apache.org/docs/dev/sql-manual/sql-functions/table-valued-functions/file)を参照してください

### 集約演算子機能の強化

Doris 3.1では、オプティマイザは集約演算子の改善に注力し、広く使用される2つの機能のサポートを追加しました。

**非標準GROUP BYサポート**

SQL標準では、select list、`HAVING`条件、または`ORDER BY`listが`GROUP BY`句に指定されていない非集約カラムを参照するクエリを許可していません。しかし、MySQLでは、SQL_MODEに"ONLY_FULL_GROUP_BY"が含まれていない場合、制限はありません。詳細については、MySQLドキュメントを参照してください: https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html#sqlmode_only_full_group_by

`ONLY_FULL_GROUP_BY`を無効にする効果は、非集約カラムで`ANY_VALUE`を使用することと同等です。例:

```SQL
-- Non-standard GROUP BY
SELECT c1, c2 FROM t GROUP BY c1
-- Equal to
SELECT c1, any_value(c2) FROM t GROUP BY c1
```
3.1では、Dorisはデフォルトで"ONLY_FULL_GROUP_BY"を有効にしており、これは以前の動作と一致しています。非標準のGROUP BY機能を使用するには、ユーザーは以下の設定を通じて有効にすることができます：

```SQL
set sql_mode = replace(@@sql_mode, 'ONLY_FULL_GROUP_BY', '');
```
**複数のDISTINCT集約のサポート**

以前のバージョンでは、集約クエリが異なるパラメータを持つ複数のDISTINCT集約関数を含み、それらのDISTINCTセマンティクスが非DISTINCTセマンティクスと異なり、かつ以下のいずれでもない場合、Dorisはそのクエリを実行できませんでした：

- 単一パラメータのCOUNT
- SUM
- AVG
- GROUP_CONCAT

Doris 3.1では、この領域が大幅に強化されました。現在は、複数のdistinct集約を含むクエリが正しく実行され、期待通りの結果を返すことができます。例えば：

```SQL
SELECT count(DISTINCT c1,c2), count(DISTINCT c2,c3), count(DISTINCT c3) FROM t;
```
## 7. 動作の変更

**VARIANT**

- `variant_max_subcolumns_count` 制約
  - 単一のテーブル内では、すべてのVariantカラムは同じ`variant_max_subcolumns_count`値を持つ必要があります：すべて0またはすべて0より大きい値。値を混在させるとテーブル作成時やスキーマ変更時にエラーが発生します。
- 新しいVariantの読み込み/書き込み/serdeおよびcompactionパスは古いデータとの後方互換性があります。古いVariantバージョンからのアップグレードにより、クエリ出力にわずかな違いが生じる場合があります（例：余分なスペースや.区切り文字によって作成される追加のレベル）。
- Variantデータ型に転置インデックスを作成すると、データフィールドがインデックス条件を満たさない場合、空のインデックスファイルが生成されます。これは期待される動作です。

**権限**

- SHOW TRANSACTIONに必要な権限が変更されました：ADMIN_PRIVの代わりにターゲットデータベースのLOAD_PRIVが必要になりました。
- SHOW FRONTENDS / BACKENDSとNODE RESTful APIは現在同じ権限を使用します。これらのインターフェースはinformation_schemaデータベースのSELECT_PRIVが必要になりました。

**Apache Doris 3.1を始める**

バージョン3.1の正式リリース前であっても、半構造化データとデータレイクのいくつかの機能は実際の本番環境シナリオで検証されており、期待されるパフォーマンスの改善を示しています。関連するニーズを持つユーザーには新しいバージョンを試すことをお勧めします：

**[GitHubでApache Doris 3.1をダウンロード](https://github.com/apache/doris/releases)** 

**[公式サイトからダウンロード](https://doris.apache.org/download)** 

**謝辞**

このリリースの開発、テスト、フィードバック提供に貢献していただいたすべての貢献者の皆様に心から感謝いたします：

@924060929 @airborne12 @amorynan @BePPPower @BiteTheDDDDt @bobhan1 @CalvinKirs @cambyzju @cjj2010 @csun5285 @DarvenDuan @dataroaring @deardeng @dtkavin @dwdwqfwe @eldenmoon @englefly @feifeifeimoon @feiniaofeiafei @felixwluo @freemandealer @Gabriel39 @gavinchou @ghkang98 @gnehil @gohalo @HappenLee @heguanhui @hello-stephen @HonestManXin @htyoung @hubgeter @hust-hhb @jacktengg @jeffreys-cat @Jibing-Li @JNSimba @kaijchen @kaka11chen @KeeProMise @koarz @liaoxin01 @liujiwen-up @liutang123 @luwei16 @MoanasDaddyXu @morningman @morrySnow @mrhhsg @Mryange @mymeiyi @nsivarajan @qidaye @qzsee @Ryan19929 @seawinde @shuke987 @sollhui @starocean999 @suxiaogang223 @SWJTU-ZhangLei @TangSiyang2001 @Vallishp @vinlee19 @w41ter @wangbo @wenzhenghu @wumeibanfa @wuwenchi @wyxxxcat @xiedeyantu @xinyiZzz @XLPE @XnY-wei @XueYuhai @xy720 @yagagagaga @Yao-MR @yiguolei @yoock @yujun777 @Yukang-Lian @Yulei-Yang @yx-keith @Z-SWEI @zclllyybb @zddr @zfr9527 @zgxme @zhangm365 @zhangstar333 @zhaorongsheng @zhiqiang-hhhh @zy-kkk @zzzxl1993
