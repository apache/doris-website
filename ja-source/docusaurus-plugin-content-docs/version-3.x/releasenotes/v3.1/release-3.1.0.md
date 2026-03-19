---
{
  "title": "Release 3.1.0",
  "language": "ja",
  "description": "Apache Doris 3.1の正式リリースを発表できることを嬉しく思います。"
}
---
**Apache Doris 3.1**の正式リリースを発表できることを嬉しく思います。これは半構造化データとlakehouseアナリティクスをより強力で実用的にするマイルストーン版です。

Doris 3.1では**VARIANT データ型のスパースカラムとスキーマテンプレート**を導入し、ユーザーが数万の動的フィールドを持つデータセットを効率的に保存、インデックス化、クエリできるようになりました。ログ、イベント、JSONを多用するワークロードに最適です。

lakehouse機能について、Doris 3.1はlakehouseにより良い**非同期マテリアライズドビュー**をもたらし、データレイクとデータウェアハウス間のより強固な橋渡しを構築します。また**IcebergとPaimon**のサポートを拡張し、複雑なlakehouseワークロードの管理をより簡単で効率的にしました。

Apache Doris 3.1の開発中、**90人以上の貢献者**が**1,000を超える改善と修正**を提出しました。開発、テスト、フィードバックを通じて貢献してくださった全ての方に心からの感謝を送りたいと思います。

**[GitHubでApache Doris 3.1をダウンロード](https://github.com/apache/doris/releases)** 

**[公式ウェブサイトからダウンロード](https://doris.apache.org/download)** 

### Apache Doris 3.1の主要ハイライト

- **半構造化データアナリティクス**
  - VARIANT型の**スパースカラム**で、数万のサブカラムをサポート
  - VARIANTの**スキーマテンプレート**で、柔軟性を失うことなく、より高速なクエリ、より安定したインデックス化、制御可能なコストを実現
  - **Inverted Indexes Storage Format**をV2からV3にアップグレードし、ストレージ使用量を最大**20%**削減
  - 3つの新しいトークナイザー：**ICU Tokenizer**、**IK Tokenizer**、**Basic Tokenizer**。また**カスタムトークナイザー**のサポートも追加し、多様なシナリオでの検索再現率を大幅に改善
- **レイクハウスアップグレード**
  - データレイクに**より良いマテリアライズドビュー機能**を導入し、データレイクとデータウェアハウス間の橋渡しを強化
  - **Iceberg**と**Paimon**のより幅広いサポート
  - **動的パーティションプルーニング**と**バッチ分割スケジューリング**で、特定のクエリワークロードを最大**40%**改善し、FE（フロントエンド）のメモリ消費を削減
  - Doris 3.1では**外部データソースの接続プロパティ**をリファクタリングし、様々なメタデータサービスやストレージシステムとの統合をより明確にし、より柔軟な接続オプションを提供
- **ストレージエンジンの改善**
  - **新しい柔軟なカラム更新**：部分カラム更新をベースに、単一のインポート内で各行に対して異なるカラムを更新可能
  - ストレージ・コンピュート分離シナリオにおいて、Doris 3.1は**MOW テーブル**のロック機構を最適化し、高並行データ取り込みの体験を改善
- **パフォーマンス最適化**
  - Doris 3.1では**パーティションプルーニングとクエリプランニング**を強化し、大規模パーティション（数万）と複雑なフィルタ表現でより高速なクエリと低いリソース使用量を実現
  - オプティマイザーでは**データ認識最適化技術**も導入し、特定のワークロードで最大**10倍のパフォーマンス向上**を達成

## 1. VARIANT 半構造化データアナリティクスの大幅アップグレード

### ストレージ機能：スパースカラムとサブカラム縦型コンパクション

従来のOLAPシステムは、数千から数万のカラムを含む「超ワイドテーブル」で、メタデータの肥大化、コンパクション増幅、クエリパフォーマンスの劣化に直面することがよくありました。**Doris 3.1**では、VARIANT型の**スパースサブカラム**と**サブカラムレベル縦型コンパクション**でこれに対処し、実用的なカラム制限を数万まで押し上げました。

**VARIANTはストレージレイヤーでの徹底的な最適化により、以下の利点をもたらします：**

- カラムナーストレージでの**サブカラム（数千から数万）の安定したサポート**で、よりスムーズなクエリとコンパクション遅延の削減を実現
- **制御可能なメタデータとインデックス化**で指数的成長を防止
- 実際のテストで**10,000を超えるサブカラム**の**サブカラムナー化**（カラムナーストレージ）が可能で、スムーズで効率的なコンパクションパフォーマンスを実現

**超ワイドテーブルの主要ユースケース：**

- **コネクテッドビークル / IoT テレメトリ：** 様々なデバイスモデルと動的に変化するセンサー次元をサポート
- **マーケティングオートメーション / CRM：** 継続的に拡張するイベントとユーザー属性（例：カスタムイベント/プロパティ）
- **広告 / イベントトラッキング：** スパースで継続的に進化するフィールドを持つ大量のオプションプロパティ
- **セキュリティ監査 / ログ：** 多様なログソースが様々なフィールドを持ち、スキーマ別に集約・検索が必要
- **Eコマース製品属性：** 幅広いカテゴリ範囲で非常に可変的な製品属性

**動作原理：** 

- **頻出JSONキーが実際のカラムになる**

	最も一般的なJSONキーを真のカラムナーサブカラムとして自動的に保持します。これによりクエリを高速に保ち、メタデータを小さく保ちます。稀なキーはコンパクトな「スパース」エリアに留まるため、テーブルが肥大化しません。

- **サブカラムのスマートで低メモリマージ**

	VARIANTサブカラムを小さな縦型グループでマージし、メモリ使用量を大幅に削減し、数千のフィールドがあってもバックグラウンドメンテナンスをスムーズに保ちます。ホットキーは自動的に検出されサブカラムに昇格されます。

- **欠損値の高速処理**

	読み取りとマージ中の行ごとのオーバーヘッドを削減するため、デフォルト値をバッチで埋めます。

- **LRUキャッシュによる軽量メタデータ**

	カラムメタデータはLRUポリシーでキャッシュされ、メモリ使用量を削減し、繰り返しアクセスを高速化します。要約すると：重要なフィールドにはカラムナー速度を得られ、ロングテールに対して重いコストを払うことなく、バックグラウンド操作はスムーズで予測可能に保たれます。

**有効化と使用方法：** 

新しいカラムレベルVariantパラメータ制御、カラムプロパティ：

`variant_max_subcolumns_count`：デフォルトは`0`で、スパースサブカラムサポートが無効であることを意味します。特定の値に設定すると、システムは最も頻度の高いTop-N JSONキーをカラムナーストレージ用に抽出し、残りのキーはスパースに保存されます。

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

スキーマテンプレートは、常に変化するJSONを重要なパスに沿って予測可能にします。これにより、クエリの実行が高速化され、インデックスが安定し、柔軟性を失うことなくコストを制御できます。利点は以下の通りです：

- **型安定性**: 重要なJSONサブパスの型をDDLでロックし、クエリエラー、インデックス無効化、暗黙のキャストオーバーヘッドを引き起こす型ドリフトを防ぎます。
- **より高速で正確な検索**: サブパスごとに転置インデックス戦略（トークン化/非トークン化、パーサー、フレーズ検索）を調整し、レイテンシを削減してヒット率を向上させます。
- **制御されたインデックスとコスト**: 列全体をインデックス化する代わりにサブパスごとにインデックスを調整することで、インデックス数、書き込み増幅、ストレージ使用量を大幅に削減します。
- **保守性とコラボレーション**: JSONの「データ契約」として機能し、チーム間でセマンティクスの一貫性を保ちます。型とインデックス状態の観察とデバッグが容易になります。
- **進化の容易さ**: ホットパスをテンプレート化し、オプションでインデックス化しながら、ロングテールフィールドの柔軟性を保つことで、予期しない問題なくスケールできます。

**有効化と使用方法:**

- `VARIANT<...>`内で共通サブパスと型（ワイルドカードを含む）を明示的に宣言します。例：`VARIANT<'a': INT, 'c.d': TEXT, 'array_int_*': ARRAY<INT>>`
- 差別化された戦略（`field_pattern`、`parsers`、`tokenization`、`phrase`検索）でサブパスごとのインデックスを設定し、ワイルドカードを使用してフィールドファミリーを一度にカバーします。
- 新しい列プロパティ：`variant_enable_typed_paths_to_sparse`
- デフォルト：`false`（型指定された事前定義パスはスパースに格納されません）
- 多くのパスがマッチし、列の拡散を避けたい場合に、型指定されたパスもスパース候補として扱うためにtrueに設定します。

要約：重要な部分をテンプレート化し、正確にインデックス化し、その他すべてを柔軟に保ちます。

**例1:** 単一列に複数のインデックスを持つスキーマ定義

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
**例 2:** ワイルドカードパターンに一致する列のバッチ処理

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
## 2. Inverted Index Storage Format V3

V2と比較して、Inverted Index V3はストレージをさらに最適化します:

- より小さなインデックスファイルにより、ディスク使用量とI/Oオーバーヘッドが削減されます。
- httplogsおよびlogsbenchデータセットでのテストでは、V3で最大20%のストレージ容量節約が示されており、大規模テキストデータとログ解析シナリオに適しています。

| Test dataSet | Data size before import | inverted_index_storage_format = v2 | inverted_index_storage_format = v3 | Space saving: V3 vs. V2 |
| :----------- | :---------------------- | :--------------------------------- | :--------------------------------- | :---------------------- |
| httplogs     | 30.89 GB                | 4.472 GB                           | 3.479 GB                           | 22.2%                   |
| logsbench    | 1479.31 GB              | 182.180 GB                         | 138.008 GB                         | 24.2%                   |

**主要な改善点:**

- **inverted indexのterm辞書にZSTD辞書圧縮を導入**し、インデックスプロパティの`dict_compression`で有効化できます。
- **inverted index内の各termに関連する位置情報の圧縮を追加**し、ストレージ使用量をさらに削減します。

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

多様なトークン化のニーズにより適切に対応するため、Doris 3.1では新しく一般的に使用されるtokenizerを追加しました：

1. **ICU Tokenizer：**

- **実装：** International Components for Unicode (ICU)に基づいています。
- **使用例：** 複雑な文字体系を持つ国際化されたテキストや多言語ドキュメントに最適です。
- **例：**

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
  - 連続する英数字は1つのtokenとして扱われます。
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

文字フィルター、トークナイザー、トークンフィルターを組み合わせることで、ユーザーは組み込みアナライザーの制限を超えて、テキストを検索可能な用語にどのように分割するかを正確に定義でき、検索の関連性と分析の精度の両方に直接影響を与えることができます。

![Custom Tokenization](/images/release-3.1/custom-tokenization.png)

**使用例**

- **問題**: デフォルトのUnicodeトークナイザーでは、「13891972631」のような電話番号は単一のトークンとして扱われるため、前方一致検索（例：「138」）が不可能です。
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
- tokenization結果を確認する：

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

バージョン3.1では、非同期マテリアライズドビューが大幅に強化され、パーティションレベルのインクリメンタルメンテナンスとパーティションレベルの透過的クエリリライトの包括的なサポートを提供するようになりました。この機能は、Iceberg、Paimon、Hudiなどのデータレイク形式で利用可能です。

Dorisはバージョン2.1で非同期マテリアライズドビューを導入し、以下を含む改善を継続してきました：

| 機能 | 説明 |
| :-------------------- | :----------------------------------------------------------- |
| Refresh | 内部テーブルとHiveテーブルの完全およびパーティションレベルのインクリメンタルメンテナンス |
| Trigger Methods | 全てのテーブルタイプでのスケジュール更新、手動更新、および内部テーブル限定のコミットによる更新 |
| partitioning | ベーステーブルと同じパーティショニング、パーティションローリング、マルチレベルパーティション、ベーステーブルの特定の「ホット」パーティションの保持機能を含む |
| Transparent Rewriting | 内部テーブルでの条件付き補償、結合リライトと導出、集約リライト、パーティション補償をサポート |
| Maintenance Tools | マテリアライズドビューのランタイム情報を照会するためのtasks()、jobs()、mv_infos()を提供 |

バージョン3.1では、クエリリライト時の外部テーブルに対するパーティションレベルのインクリメンタルメンテナンスとパーティションレベル補償の包括的なサポートを提供することで、lakehouse機能の強化に焦点を当てています。この強化は、Iceberg、Paimon、Hudiなどの主流のデータレイクテーブル形式を対象とし、データレイクとデータウェアハウス間の高速データブリッジを効果的に構築します。サポートの詳細な範囲は以下の表に示されています。

**具体的なサポート詳細は以下を参照：**

| External Source | Partition Refresh | Transparent Partition Rewriting |
| :-------------- | :----------------------------------------------------------- | :------------------------------ |
| Hive | サポート済み | サポート済み |
| Iceberg | サポート済み | サポート済み |
| Paimon | サポート済み | サポート済み |
| Hudi | パーティション同期の検出不可；特定パーティションの手動更新に適している | サポート済み |

### IcebergとPaimonのサポート向上

#### 1. Iceberg

Doris 3.1では、Icebergテーブル形式に対する幅広い最適化と強化を導入し、最新のIceberg機能との互換性を提供しています。

**Branch / Tagライフサイクル管理**

3.1から、DorisはIceberg BranchesとTagsの作成、削除、読み取り、書き込みをネイティブでサポートします。Gitと同様に、これによりユーザーはIcebergテーブルデータのバージョンをシームレスに管理できます。この機能により、ユーザーは外部エンジンやカスタムロジックに依存することなく、並列バージョン管理、カナリアリリース、環境分離を実行できます。

```SQL
-- Create branches
ALTER TABLE iceberg_tbl CREATE BRANCH b1;
-- Write data to a specific branch
INSERT INTO iceberg_tbl@branch(b1) values(1, 2);
-- Query data from a specific branch
SELECT * FROM iceberg_tbl@branch(b1);
```
**包括的なシステムテーブルサポート**

Doris 3.1では、`$entries`、`$files`、`$history`、`$manifests`、`$refs`、`$snapshots`などのIcebergシステムテーブルのサポートが追加されました。ユーザーは`SELECT * FROM iceberg_table$history`や`…$refs`などのコマンドでIcebergを直接クエリして、メタデータ、スナップショット履歴、ブランチ/タグマッピング、ファイル構成を検査できます。これにより、メタデータの観測性が大幅に向上し、問題診断、パフォーマンス調整、ガバナンスがより透明性を持って行えるようになります。

`SELECT * FROM iceberg_table$history`や`…$refs`などのステートメントを使用して、Icebergの基盤となるメタデータ、スナップショットリスト、ブランチ、タグ情報を直接クエリできます。これにより、データファイルの構成、スナップショット変更の履歴、ブランチマッピングについて詳細な洞察を得ることができます。この機能により、Icebergメタデータの観測性が大幅に向上し、問題のトラブルシューティング、最適化分析の実行、ガバナンスの決定がより簡単で透明性の高いものになります。

**例:** システムテーブル経由で削除されたファイル数をクエリする。

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
**Iceberg Viewのクエリサポート**

Doris 3.1では、Iceberg論理ビューへのアクセスとクエリのサポートが追加され、DorisのIceberg機能がさらに強化されました。今後の3.xリリースでは、Iceberg ViewのSQLダイアレクト変換サポートを追加する予定です。

**ALTER文によるスキーマ進化**

3.1以降、DorisはALTER TABLE文を通じてIcebergテーブルでの列の追加、削除、名前変更、および並び替えをサポートします。これにより、Sparkなどのサードパーティエンジンを必要とせずにIcebergテーブルを管理するDorisの機能がさらに強化されます。

```SQL
ALTER TABLE iceberg_table
ADD COLUMN new_col int;
```
さらに、バージョン3.1では、新しいIceberg機能をより良くサポートするため、Icebergの依存関係がバージョン1.9.2にアップグレードされました。今後の3.1.xリリースでは、データコンパクションやブランチ進化を含む、Icebergテーブル管理がさらに改善される予定です。

ドキュメント: https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog

#### 2. Paimon

Doris 3.1では、実際の使用事例に基づいて、Paimonテーブル形式にいくつかの更新と機能強化をもたらします。

**Paimonバッチ増分クエリのサポート**

Doris 3.1では、Paimonテーブル内の指定された2つのスナップショット間の増分データを読み取ることができます。これにより、ユーザーはPaimonの増分データにより良くアクセスでき、特にPaimonテーブル上での増分集約マテリアライズドビューが可能になります。

```SQL
SELECT * FROM paimon_tbl@incr('startSnapshotId'='2', 'endSnapshotId'='5');
```
**ブランチとタグの読み取り**

3.1以降、DorisはPaimonテーブルデータのブランチおよびタグからの読み取りをサポートし、より柔軟なマルチバージョンデータアクセスを提供します。

```SQL
SELECT * FROM paimon_tbl@branch(branch1);
SELECT * FROM paimon_tbl@tag(tag1);
```
**包括的なシステムテーブルサポート**

Icebergと同様に、3.1では`$files`、`$partitions`、`$manifests`、`$tags`、`$snapshots`などのPaimonシステムテーブルのサポートが追加されました。ユーザーは`SELECT * FROM partition_table$files`のようなステートメントで基盤となるメタデータを直接クエリでき、Paimonテーブルの探索、デバッグ、最適化がより簡単になります。

例えば、システムテーブルを使用してパーティションごとに追加された新しいデータファイルの数をカウントできます。

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
3.1では、Paimonの依存関係がバージョン1.1.1にアップグレードされ、新機能をより良くサポートします。

ドキュメント: https://doris.apache.org/docs/lakehouse/catalogs/paimon-catalog

### データレイククエリパフォーマンスの向上

Doris 3.1では、データレイクテーブル形式に対する徹底的な最適化を追加し、実際の本番環境でより安定で効率的なデータレイク分析を提供することを目指しています。

1. **Dynamic Partition Pruning**

複数テーブルの結合クエリにおいて、この機能は実行時に右側のテーブルからパーティション述語を生成し、それを左側のテーブルに適用します。不要なパーティションを動的に除去することで、データI/Oを削減し、クエリパフォーマンスを向上させます。Doris 3.0ではHiveテーブルに対してdynamic partition pruningを導入しました。3.1では、この機能をIceberg、Paimon、Hudiテーブルに拡張しました。テストシナリオでは、高い選択性を持つクエリで**30%〜40%のパフォーマンス向上**を示しました。

2. **Batch Split Scheduling**

レイクハウステーブルが大量のシャードを含む場合、従来はFrontend（FE）がすべてのシャードメタデータを一度に収集し、Backend（BE）に送信していました。これにより、特に大規模なデータセットでのクエリにおいて、FEの高いメモリ消費と長いプランニング時間が発生する可能性がありました。

バッチシャード実行は、シャードメタデータをバッチで生成し、生成された順に実行することでこれを解決します。これによりFEのメモリ負荷が軽減され、プランニングと実行を並列で実行できるようになり、全体的な効率が向上します。Doris 3.0ではHiveテーブルでこの機能のサポートを追加し、3.1ではIcebergテーブルに拡張しました。大規模なテストシナリオでは、FEメモリ使用量とクエリプランニング時間が大幅に削減されました。

### 連携分析：より柔軟で強力なコネクタ

3.1では、Dorisは外部データソースのコネクタプロパティを再構築しました。これにより、異なるメタデータサービスやストレージシステムとの統合が容易になり、サポートされる機能の範囲も拡張されました。

#### 1. より柔軟なData Lake Rest Catalogサポート

- **Iceberg REST Catalog**

	Iceberg REST Catalogのサポートを改善しました。Doris 3.1は現在、Unity、Polaris、Gravitino、Glueを含む複数のバックエンド実装で動作します。また、vended credentialsのサポートを追加し、より安全で柔軟な認証情報管理を可能にしました。AWSをサポートしており、GCPとAzureのサポートは今後のリリースで予定されています。

ドキュメントを参照: [documentation](https://doris.apache.org/docs/lakehouse/metastores/iceberg-rest) 

- **Paimon REST Catalog**

	Doris 3.1では、Alibaba Cloud DLFを介したPaimon REST Catalogのサポートを導入し、最新のDLFバージョンで管理されるPaimonテーブルへの直接アクセスを可能にしました。

ドキュメントを参照: [documentation](https://doris.apache.org/docs/lakehouse/best-practices/doris-dlf-paimon)

#### 2. より強力なHadoopエコシステムサポート

- **Multi-Kerberos環境サポート**

    Doris 3.1では、同一クラスター内で複数のKerberos認証環境へのアクセスが可能です。異なる環境では、別々のKDCサービス、Principals、Keytabsを使用できます。Doris 3.1では、各Catalogを独立して独自のKerberos設定で構成できるようになりました。この機能により、複数のKerberos環境を持つユーザーが統一されたアクセス制御でDorisを通じてすべてを管理することが非常に容易になります。

ドキュメントを参照: [documentation](https://doris.apache.org/docs/lakehouse/storages/hdfs#kerberos-authentication)

- **Multi-Hadoop環境サポート**

    以前は、Dorisはconfディレクトリ下に単一のHadoop設定（例：hive-site.xml、hdfs-site.xml）のみを配置することができました。複数のHadoop環境と設定はサポートされていませんでした。Doris 3.1では、ユーザーは異なるCatalogに異なるHadoop設定ファイルを割り当てることができるようになり、外部データソースを柔軟に管理することが容易になりました。

ドキュメントを参照: [documentation](https://doris.apache.org/docs/lakehouse/storages/hdfs#kerberos-authentication) 

## 4. ストレージエンジンの改善

Doris 3.1では、ストレージレイヤーの継続的な改善を行い、パフォーマンスと安定性を向上させました。

### 柔軟な列更新：新しいデータ更新体験

以前、Dorisの**Partial Column Update**機能では、単一のインポート内の各行が同じ列セットを更新する必要がありました。しかし、多くのシナリオでは、ソースシステムは主キーと更新される特定の列のみを含むレコードを提供し、異なる行が異なる列を更新します。これに対処するため、Dorisは**Flexible Column Update**機能を導入し、列ごとのデータ準備におけるユーザーのワークロードを大幅に簡素化し、書き込みパフォーマンスを向上させました。

**使用方法**

- Merge-on-Write Uniqueテーブル作成時に有効化：
  -  `"enable_unique_key_skip_bitmap_column" = "true"`
- インポートモードの指定：
  -  `unique_key_update_mode: UPDATE_FLEXIBLE_COLUMNS`
- Dorisが自動的に柔軟な列更新を処理し、欠損データを補完します。

**例**

柔軟な列更新により、同じインポート内で異なる行が異なる列を更新できます：

- 行の削除（`DORIS_DELETE_SIGN`）
- 特定の列の更新（例：`v1`、`v2`、`v5`）
- 主キーと更新された列のみで新しい行を挿入；その他の列はデフォルト値または履歴データを使用

**パフォーマンス**

- テスト環境：1 FE + 4 BE、16C 64GB、300M行 × 101列、3レプリカ
  - 1列のみ更新する20,000行をインポート（99列は自動補完）
  - 単一同時実行インポートパフォーマンス：10.4k行/秒
  - ノードあたりのリソース使用量：CPU ~60%、メモリ ~30GB、読み取りIOPS ~7.5k/秒、書き込みIOPS ~5k/秒

### ストレージ・コンピュート分離：MOWロック最適化

ストレージ・コンピュート分離シナリオでは、MOWテーブルのDelete Bitmap更新には分散ロック`delete_bitmap_update_lock`の取得が必要です。以前は、インポート、コンパクション、スキーマ変更操作がロックで競合し、高い同時実行インポートの下で長い待機時間や失敗を引き起こしていました。

大規模で同時実行データ取り込みをより安定かつ効率的にするため、いくつかの最適化を追加しました。これには**コンパクションロック時間の短縮**が含まれ、高同時実行マルチタブレットインポートテストでp99コミット遅延を1.68分から49.4秒に短縮しました。また、待機閾値を超えた後にトランザクションが強制ロックできるようにして**ロングテール インポート遅延を削減**しました。

## 5. クエリパフォーマンスの向上

### パーティションプルーニングのパフォーマンスとカバレッジの向上

Dorisはデータを独立して保存、クエリ、管理できるパーティションに整理します。パーティショニングはクエリパフォーマンスを向上させ、データ管理を最適化し、リソース消費を削減します。クエリ実行時に、フィルタを適用して関係のないパーティションをスキップすること（パーティションプルーニングとして知られる）は、システムリソース使用量を削減しながらパフォーマンスを大幅に向上させることができます。

ログ分析やリスク制御システムなどの使用例では、単一のテーブルが数万、さらには数十万のパーティションを持つ可能性がありますが、ほとんどのクエリは数百のパーティションのみに触れます。したがって、効率的なパーティションプルーニングはパフォーマンスにとって重要です。

3.1では、Dorisはパーティションプルーニングのパフォーマンスと適用性を大幅に向上させるいくつかの最適化を導入しています：

- **パーティションプルーニングのバイナリサーチ：** 時間列に基づくパーティションについて、列値に従ってパーティションをソートすることでパーティションプルーニングプロセスが最適化されました。これにより、プルーニング計算が線形スキャンからバイナリサーチに変更されます。DATETIME パーティションフィールドを使用した136,000パーティションのシナリオでは、この最適化によりプルーニング時間が724ミリ秒から43ミリ秒に短縮され、16倍以上の高速化を実現しました。
- **パーティションプルーニングにおける大量の単調関数のサポートを追加：** 実際の使用例では、時間パーティション列のフィルタ条件は、しばしば単純な論理比較ではなく、パーティション列の時間関連関数を含む複雑な式です。例えば、`to_date(time_stamp) > '2022-12-22'`、`date_format(timestamp,'%Y-%m-%d %H:%i:%s') > '2022-12-22 11:00:00'`のような式です。Doris 3.1では、関数が単調である場合、Dorisはパーティション境界値を評価することで、パーティション全体をプルーニングできるかどうかを判断できます。そしてDoris 3.1は既にCASTと25の一般的に使用される時間関連関数をサポートしており、時間パーティション列の大部分のフィルタ条件をカバーしています。
- **フルパスコード最適化：** さらに、Doris 3.1では、パーティションプルーニングコードパス全体がコードレベルで徹底的に最適化され、不要なオーバーヘッドを排除しました。

### データ特性：最大10倍のパフォーマンス向上

Doris 3.1では、オプティマイザーがデータ特性をより賢く活用してクエリパフォーマンスを向上させることができます。クエリプラン内の各ノードを分析してUNIQUE、UNIFORM、EQUAL SETなどのデータ特性を収集し、列間の関数従属性を推論します。ノードのデータが特定の特性を満たす場合、Dorisは不要な結合、集約、またはソートを排除でき、パフォーマンスを大幅に向上させます。

これらの最適化を活用するように設計されたテストケースでは、データ特性の活用により**10倍以上のパフォーマンス向上**を達成しました。詳細は以下の表を参照してください：

| **最適化**                                     | **最適化済み** | **最適化なし** | **パフォーマンス向上** |
| :--------------------------------------------------- | :------------ | :---------------- | :-------------------- |
| 一意結合キーに基づく結合の排除            | 50 ms         | 100 ms            | 100%                  |
| 一意性を使用した冗長集約キーの削除   | 80 ms         | 960 ms            | 1100%                 |
| 関数従属性による集約キーの削除 | 1410 ms       | 2110 ms           | 50%                   |
| 均一列での集約キーの削除           | 110 ms        | 150 ms            | 36%                   |
| 不要なソートの排除                        | 130 ms        | 370 ms            | 185%                  |

## 6. 機能改善

### 半構造化データ

**VARIANT**

- `variant_type(x)`関数を追加：Variantサブフィールドの現在の実際の型を返します。
- 関数パラメータと戻り値の型推論能力を向上させるためにComputeSignature/Helperを追加しました。

**STRUCT**

- Schema ChangeでSTRUCT型へのサブカラム追加をサポートしました。

#### Lakehouse

- Catalogレベルでのメタデータキャッシュポリシーの設定（例：キャッシュ有効期限）をサポートし、データの新鮮さとメタデータアクセスパフォーマンスのバランスをユーザーがより柔軟に取れるようになりました。

ドキュメントを参照: [documentation](https://doris.apache.org/docs/lakehouse/meta-cache)

- `FILE()` Table Valued Functionのサポートを追加し、既存の`S3()`、`HDFS()`、`LOCAL()`関数を単一のインターフェースに統合して、使いやすさと理解しやすさを向上させました。

ドキュメントを参照: [documentation](https://doris.apache.org/docs/dev/sql-manual/sql-functions/table-valued-functions/file)

### 集約演算子機能の向上

Doris 3.1では、オプティマイザーは集約演算子の改善に焦点を当て、広く使用される2つの機能のサポートを追加しました。

**非標準GROUP BYサポート**

SQL標準では、select list、`HAVING`条件、または`ORDER BY`リストが`GROUP BY`句で指定されていない非集約列を参照するクエリは許可されていません。しかし、MySQLでは、SQL_MODEに"ONLY_FULL_GROUP_BY"が含まれていない場合、制限がありません。詳細はMySQLドキュメントを参照してください：https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html#sqlmode_only_full_group_by

`ONLY_FULL_GROUP_BY`を無効にする効果は、非集約列で`ANY_VALUE`を使用することと同等です。例えば：

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
**複数のDISTINCT集計のサポート**

以前のバージョンでは、集計クエリに異なるパラメータを持つ複数のDISTINCT集計関数が含まれており、それらのDISTINCTセマンティクスが非DISTINCTセマンティクスと異なり、かつ以下のいずれでもない場合、Dorisはクエリを実行できませんでした：

- 単一パラメータのCOUNT
- SUM
- AVG
- GROUP_CONCAT

Doris 3.1では、この領域が大幅に強化されました。複数のdistinct集計を含むクエリが正しく実行され、期待通りの結果を返すようになりました。例えば：

```SQL
SELECT count(DISTINCT c1,c2), count(DISTINCT c2,c3), count(DISTINCT c3) FROM t;
```
## 7. 動作の変更

**VARIANT**

- `variant_max_subcolumns_count`制約
  - 単一のテーブルでは、すべてのVariantカラムが同じ`variant_max_subcolumns_count`値を持つ必要があります：すべて0またはすべて0より大きい値。値を混在させるとテーブル作成時またはスキーマ変更時にエラーが発生します。
- 新しいVariantの読み取り/書き込み/serdeおよびcompactionパスは古いデータとの後方互換性があります。古いVariantバージョンからアップグレードすると、クエリ出力にわずかな違いが生じる場合があります（例：余分なスペースや.セパレータによって作成される追加レベル）。
- Variantデータ型でinverted indexを作成すると、データフィールドがインデックス条件を満たさない場合、空のインデックスファイルが生成されます；これは期待される動作です。

**権限**

- SHOW TRANSACTIONに必要な権限が変更されました：ADMIN_PRIVの代わりにターゲットデータベースでのLOAD_PRIVが必要になりました。
- SHOW FRONTENDS / BACKENDSとNODE RESTful APIは同じ権限を使用するようになりました。これらのインターフェースはinformation_schemaデータベースでのSELECT_PRIVが必要になりました。

**Apache Doris 3.1を始める**

バージョン3.1の正式リリース前でも、半構造化データとデータレイクのいくつかの機能は実際の本番環境で検証されており、期待される性能向上を示しています。関連するニーズを持つユーザーには新しいバージョンをお試しいただくことを推奨します：

**[GitHubでApache Doris 3.1をダウンロード](https://github.com/apache/doris/releases)** 

**[公式ウェブサイトからダウンロード](https://doris.apache.org/download)** 

**謝辞**

このリリースの開発、テスト、およびフィードバックに貢献してくださったすべての貢献者に心から感謝いたします：

@924060929 @airborne12 @amorynan @BePPPower @BiteTheDDDDt @bobhan1 @CalvinKirs @cambyzju @cjj2010 @csun5285 @DarvenDuan @dataroaring @deardeng @dtkavin @dwdwqfwe @eldenmoon @englefly @feifeifeimoon @feiniaofeiafei @felixwluo @freemandealer @Gabriel39 @gavinchou @ghkang98 @gnehil @gohalo @HappenLee @heguanhui @hello-stephen @HonestManXin @htyoung @hubgeter @hust-hhb @jacktengg @jeffreys-cat @Jibing-Li @JNSimba @kaijchen @kaka11chen @KeeProMise @koarz @liaoxin01 @liujiwen-up @liutang123 @luwei16 @MoanasDaddyXu @morningman @morrySnow @mrhhsg @Mryange @mymeiyi @nsivarajan @qidaye @qzsee @Ryan19929 @seawinde @shuke987 @sollhui @starocean999 @suxiaogang223 @SWJTU-ZhangLei @TangSiyang2001 @Vallishp @vinlee19 @w41ter @wangbo @wenzhenghu @wumeibanfa @wuwenchi @wyxxxcat @xiedeyantu @xinyiZzz @XLPE @XnY-wei @XueYuhai @xy720 @yagagagaga @Yao-MR @yiguolei @yoock @yujun777 @Yukang-Lian @Yulei-Yang @yx-keith @Z-SWEI @zclllyybb @zddr @zfr9527 @zgxme @zhangm365 @zhangstar333 @zhaorongsheng @zhiqiang-hhhh @zy-kkk @zzzxl1993
