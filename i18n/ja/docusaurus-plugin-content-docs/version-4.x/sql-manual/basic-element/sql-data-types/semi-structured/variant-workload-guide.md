---
{
    "title": "VARIANT ワークロードガイド",
    "language": "ja",
    "description": "VARIANT を使う場面、デフォルト、スパースカラム、DOC モード、Schema Template の選び方、および設定の出発点を示すガイド。"
}
---

## 概要

`VARIANT` は半構造化 JSON を格納し、頻繁に使うパスをサブカラム化（Subcolumnization）します。

新しい `VARIANT` ワークロードのデータモデルを決める際に、このガイドを参照してください。次のような疑問に答えます。

- このワークロードには `VARIANT` と固定カラムのどちらを使うべきか。
- JSON の幅が非常に広い場合、デフォルトの動作、スパースカラム、DOC モードのどれから始めるべきか。
- どの設定をデフォルトのままにし、どの設定から変更すべきか。

`VARIANT` を使うことが決まっており、構文や型の規則だけが必要な場合は、[VARIANT](./VARIANT) を参照してください。最小限の実行可能なインポート例が必要な場合は、[VARIANT データのインポート](../../../../data-operate/import/complex-types/variant) を参照してください。

:::tip VARIANT を選ぶ理由
`VARIANT` は JSON の柔軟性を保ちながら、Doris が頻繁に使うパスをサブカラム化できるようにします。これにより、ドキュメント全体のスキーマを事前に固定せずに、よく使うフィルター、集約、パス単位のインデックスを効率よく利用できます。非常に幅の広い JSON でも、ストレージ層の最適化により、はるかに多くのパスに対してサブカラム化を実用的に利用できます。
:::

## VARIANT が適する場合

次の条件の大半に当てはまる場合、通常は `VARIANT` が適しています。

- 入力が JSON、またはフィールドが時間とともに変化する半構造化データである。
- クエリは通常、全行の全フィールドではなく、頻繁に使うパスの一部にアクセスする。
- カラム指向分析の性能を維持しながら、スキーマの柔軟性も確保したい。
- インデックスが必要なパスがある一方、ほかの多くのパスは動的なままでよい。

次の条件が主な要件である場合は、固定カラムを優先してください。

- スキーマが安定しており、事前に分かっている。
- 主要なフィールドを結合キー、ソートキー、または型を厳密に管理するカラムとして常用する。
- 主な要件が、生の JSON をパス単位で分析することではなく、アーカイブすることである。

## 最初に確認する四つの質問

設定を変更する前に、次の四つの質問に答えてください。

### 1. 頻繁に使うパスは明確か

クエリが同じ JSON パスに繰り返しアクセスする場合、Doris はそれらのパスをサブカラム化できます。この場合に `VARIANT` の利点が最も大きくなります。

### 2. 固定の型や安定したインデックスが必要なパスは少数か

該当する場合は、それらのパスにだけ Schema Template を使ってください。Schema Template はドキュメント全体を記述するためではなく、ビジネス上重要な少数のフィールドを対象としています。

### 3. JSON の幅は実際に広くなっているか

パス数が増え続け、メタデータやコンパクションへの負荷、または目立つクエリのオーバーヘッドが生じ始めたら、幅の広い JSON として対処する必要があります。

### 4. 幅の広い JSON では、頻繁に使うパスの分析とドキュメント全体の返却のどちらが重要か

- 主な価値が、よく使うフィールドに対するパス単位のフィルタリング、集約、インデックスにある場合は、スパースカラムを選ぶ方向で検討してください。
- 主な価値が取り込み効率、またはドキュメント全体の返却にある場合は、DOC モードを選ぶ方向で検討してください。

## 主な概念

以下のストレージモードを読む前に、次の用語を確認してください。各用語は 2-3 行で説明しています。実装の詳細は [VARIANT](./VARIANT) を参照してください。

**サブカラム化（Subcolumnization）。** データが `VARIANT` カラムに書き込まれると、Doris は JSON パスを自動検出し、頻繁に使うパスを独立したカラム指向のサブカラムとして抽出して、分析を効率化します。

<img src="/images/variant/variant-default-storage.png" alt="デフォルトの VARIANT: サブカラムの自動抽出" width="720" />

**Schema Template。** `VARIANT` カラム内で選択したパスの型を固定する宣言です。型、インデックス、動作を安定させる必要がある主要なビジネスフィールドに使います。考えられるすべてのパスを列挙しないでください。

**幅の広い JSON。** 異なるパスの数が増え続け、メタデータのサイズ、書き込みコスト、コンパクションコスト、またはクエリコストが増加し始めた状態です。

**スパースカラム。** 幅の広い JSON で、頻繁に使うパスと使わないパスが明確に分かれる場合、よく使うパスはサブカラム化し、使用頻度の低いロングテールのパスは共有スパースストレージに格納します。スパースストレージは、読み取りの並列性を高めるために複数の物理カラムへのシャーディングをサポートします。

<img src="/images/variant/variant-sparse-storage.png" alt="スパースカラム: 使用頻度の高いパスと低いパスの分離" width="720" />

上図のように、頻繁に使うパス（`user_id`、`page` など）は分析性能を維持する独立したカラム指向サブカラムになり、使用頻度の低い何千ものパスは共有スパースストレージにまとめられます。しきい値は `variant_max_subcolumns_count` で制御します。

**スパースシャーディング。** 使用頻度の低いパスが非常に多い場合、単一のスパースカラムが読み取りのボトルネックになることがあります。スパースシャーディングは、使用頻度の低いパスをハッシュによって複数の物理カラムに分散し（`variant_sparse_hash_shard_count`）、並列スキャンを可能にします。

<img src="/images/variant/variant-sparse-sharding.png" alt="スパースシャーディング: 使用頻度の低いパスの並列読み取り" width="720" />

**DOC モード。** 書き込み時のサブカラム化を遅らせ、元の JSON をマップ形式の格納フィールド（**doc map**）にも保存します。追加のストレージを使う代わりに、取り込みが速くなり、ドキュメント全体を効率よく返せます。サブカラム化は後でコンパクション中にも行われます。

<img src="/images/variant/variant-doc-mode.png" alt="DOC モード: 抽出の遅延とドキュメント全体の高速な返却" width="700" />

上図のように、書き込み時には JSON がそのまま Doc Store に保存されるため、取り込みが速くなります。サブカラムは後でコンパクション中に抽出されます。読み取り時には、パス単位のクエリ（例: `SELECT v['user_id']`）は実体化されたサブカラムを読み取り、カラム指向の性能を発揮します。一方、ドキュメント全体のクエリ（`SELECT v`）は、サブカラムから再構築せずに Doc Store から直接読み取ります。

DOC モードには、クエリ対象のパスが実体化済みかどうかに応じて、次の三種類の読み取り経路があります。

<img src="/images/variant/variant-doc-mode-readpaths.png" alt="DOC モード: 読み取り経路の詳細" width="720" />

- **DOC Materialized（実体化済み）**: クエリ対象のパスは、コンパクション後、または `variant_doc_materialization_min_rows` の条件を満たしたときにサブカラムへ抽出されています。デフォルトの VARIANT と同じ、カラム指向の性能で読み取れます。
- **DOC Map**: クエリ対象のパスはまだ実体化されていません。値を探すために doc map 全体をスキャンする処理に切り替わり、幅の広い JSON では大幅に遅くなります。
- **DOC Map（シャーディングあり）**: 同じ代替処理ですが、`variant_doc_hash_shard_count` によって doc map が複数の物理カラムに分散されます。並列スキャンが可能になり、読み取り性能が大きく改善します。

**ストレージフォーマット V3。** カラムのメタデータをセグメントのフッターから分離します。何千ものサブカラムが存在する場合のメタデータのボトルネックを解消するため、特に幅の広い JSON を含む、すべての `VARIANT` テーブルに推奨します。

## 推奨する選択手順

<img src="/images/variant/variant-decision-flowchart.png" alt="VARIANT モードの選択手順" width="520" />

## ストレージモード

まず次の表で出発点を選び、該当する節を読んでください。

| | 典型的なシナリオ | 推奨モード | 主な設定 |
|---|---|---|---|
| **A** | イベントログ、監査ログ | デフォルトの VARIANT + V3 | デフォルト設定を維持 |
| **B** | 広告、テレメトリ、ユーザープロファイル（幅が広く、頻繁に使うパスは少数） | スパース + V3 | `variant_max_subcolumns_count`、`variant_sparse_hash_shard_count` |
| **C** | モデル出力、トレース、アーカイブ（取り込み優先、またはドキュメント全体の返却） | DOC モード + V3 | `variant_enable_doc_mode`、`variant_doc_materialization_min_rows` |
| **D** | 注文、決済、デバイス（主要なパスに安定した型が必要） | Schema Template + A または B | 主要なパスだけを定義 |

### デフォルトモード

ほとんどの新しい `VARIANT` ワークロードでは、これが最も安全な出発点です。

典型例は、クエリが少数の決まったパスに繰り返しアクセスするイベントログや監査データです。

```sql
CREATE TABLE IF NOT EXISTS event_log (
    ts DATETIME NOT NULL,
    event_id BIGINT NOT NULL,
    event_type VARCHAR(64),
    payload VARIANT
)
DUPLICATE KEY(`ts`, `event_id`)
DISTRIBUTED BY HASH(`event_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

スパースカラムや DOC モードが必要なほど幅の広いワークロードかまだ分からず、主な価値が複数のよく使うパスに対するフィルタリング、集約、グループ化にある場合に使います。

注意点:
- パス数の増加による負荷がまだ生じていない場合は、早い段階で `variant_max_subcolumns_count` を増やさないでください。
- JSON の幅が広くない場合、スパースカラムや DOC モードを有効にしても、利点なく複雑さが増すだけです。

### スパースモード

データの幅は広いものの、ほとんどのクエリが少数の頻繁に使うパスに集中する場合は、スパースカラムを選びます。

典型例は、何千ものオプション属性を持ちながら、定期的にクエリされる属性は数十個だけの広告、テレメトリ、プロファイルの JSON です。

```sql
CREATE TABLE IF NOT EXISTS telemetry_wide (
    ts DATETIME NOT NULL,
    device_id BIGINT NOT NULL,
    attributes VARIANT<
        'device_type' : STRING,
        'region' : STRING,
        properties(
            'variant_max_subcolumns_count' = '2048',
            'variant_sparse_hash_shard_count' = '64'
        )
    >
)
DUPLICATE KEY(`ts`, `device_id`)
DISTRIBUTED BY HASH(`device_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

キーの総数は非常に多いものの、主なワークロードがパス単位のフィルタリング、集約、インデックスである場合に使います。

注意点:
- 頻繁に使うパスの分析がボトルネックなら、最初に DOC モードへ切り替えないでください。
- `variant_max_subcolumns_count` のデフォルト値は `2048` で、ほとんどのワークロードで自動サブカラム化を始めるのに適した値です。実質的にすべてのパスがサブカラム化されるほど大きく設定しないでください。抽出するサブカラムを非常に多く必要とするワークロードでは、[DOC モード](#doc-mode-template) を優先してください。

### DOC モード {#doc-mode-template}

パス単位の分析の最適化よりも、JSON ドキュメント全体の返却や取り込み時のオーバーヘッドの削減が重要な場合は、DOC モードを選びます。

典型例は、完全なデータとして返すことが多いモデルの応答、トレースのスナップショット、アーカイブされた JSON ドキュメントです。

DOC モードが役立つ場合と効果:

- サブカラム化するパス数が非常に多くなると（10,000 パスに近づくと）、ハードウェア要件が急速に高まります。この規模では DOC モードのほうが安定した選択肢です。
- 積極的にサブカラム化するデフォルトモードと比べて、コンパクション時のメモリ使用量が約三分の二減ることがあります。
- 幅の広いスパースカラムの取り込みワークロードでは、スループットが約 5–10× になることがあります。
- クエリが `VARIANT` 値全体を読み取る場合（`SELECT variant_col`）、DOC モードでは何千ものサブカラムからドキュメントを再構築せずに済み、桁違いに高速になります。

**はじめに:**

```sql
CREATE TABLE IF NOT EXISTS trace_archive (
    ts DATETIME NOT NULL,
    trace_id VARCHAR(64) NOT NULL,
    span VARIANT<
        'service_name' : STRING,
        properties(
            'variant_enable_doc_mode' = 'true',
            'variant_doc_materialization_min_rows' = '10000',
            'variant_doc_hash_shard_count' = '64'
        )
    >
)
DUPLICATE KEY(`ts`, `trace_id`)
DISTRIBUTED BY HASH(`trace_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

取り込みスループットが最優先である場合、JSON ドキュメント全体を頻繁に返す必要がある場合、または非常に幅の広いカラムを `SELECT variant_col` で読み取ることが多い場合に使います。

注意点:
- DOC モードは、幅の広いすべての JSON ワークロードに対するデフォルトの答えではありません。頻繁に使うパスの分析が中心なら、通常はスパースカラムのほうが適しています。
- DOC モードとスパースカラムは排他的であり、同時に有効にはできません。

### Schema Template

少数のパスに安定した型、安定した動作、またはパス固有のインデックスが必要な場合は、Schema Template を選びます。

典型例は、ビジネス上重要な少数のパスで型と検索可能性を維持する必要がある注文、決済、デバイスのデータです。

```sql
CREATE TABLE IF NOT EXISTS order_events (
    ts DATETIME NOT NULL,
    order_id BIGINT NOT NULL,
    detail VARIANT<
        'status' : STRING,
        'amount' : DECIMAL(18, 2),
        'currency' : STRING
    >,
    INDEX idx_status(detail) USING INVERTED PROPERTIES("field_pattern" = "status")
)
DUPLICATE KEY(`ts`, `order_id`)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

ビジネス上重要なフィールドが少数で、それらのパスに厳密な型付けやパス単位のインデックス戦略が必要な場合に使います。適切な場合は、Schema Template をスパースカラムまたはデフォルトの `VARIANT` と組み合わせてください。

注意点:
- JSON スキーマ全体を固定のテンプレートにしないでください。`VARIANT` の利点が失われます。
- Schema Template の対象は主要なパスだけにし、残りは動的なままにしてください。

## 性能

次のグラフは、10K パスの幅の広いカラムを持つデータセットに対する単一パスの抽出時間を比較したものです（200K 行、一つのキーを抽出、16 CPU、3 回実行した中央値）。

<img src="/images/variant/variant-bench-query-time.svg" alt="幅の広いカラムから単一パスを抽出するクエリの実行時間" width="720" />

| モード | クエリ時間 | 最大メモリ使用量 |
|---|---:|---:|
| DOC Materialized（実体化済み） | 76 ms | 1 MiB |
| VARIANT デフォルト | 76 ms | 1 MiB |
| DOC Map（シャーディングあり） | 148 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| DOC Map | 2,533 ms | 1 MiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING（生の JSON） | 6,104 ms | 48 GiB |

主なポイント:

- **実体化されたサブカラムが最速です。** デフォルトモードと DOC Materialized はいずれも約 76 ms で、生の STRING より 80×、JSONB より 12× 高速です。
- **doc map のシャーディングが効果的です。** doc map をシャーディングすると、実体化されていないパスのクエリ時間が 2.5 秒から 148 ms に短縮されます。
- **JSONB と STRING は大量のメモリを使います。** 最大メモリ使用量は 32–48 GiB で、VARIANT モードの 1 MiB を大きく上回ります。

## ベストプラクティス

### インポート時

- **新しい `VARIANT` テーブルにはストレージフォーマット V3 を使用してください。** V3 はカラムのメタデータをセグメントのフッターから分離します。このフォーマットを使わない場合、幅の広い JSON ワークロードではファイルを開く処理が遅くなり、メモリのオーバーヘッドが増えます。
- **主要なパスは早い段階で Schema Template によって固定してください。** Schema Template を使わない場合、システムは型を自動推論します。同じパスの型がバッチ間で変わると（例: 整数から文字列）、JSONB に昇格し、そのパスのインデックスが失われます。
- **デフォルト設定から始め、問題が現れてから調整してください。** ほとんどのワークロードではデフォルト設定で十分です。AI トレーニング、コネクテッドカー、ユーザータグシステムなど、サブカラム化するパスを非常に多く必要とし、パス単位のインデックスも多数使うワークロードに限って、シナリオに応じて調整してください。初日から過剰に設定すると（`variant_max_subcolumns_count` を非常に大きくする、不要な DOC モードを有効にするなど）、効果が確認できないまま複雑さが増します。

### クエリ時

- **`SELECT *` を、非常に幅の広い `VARIANT` カラムの主なクエリパターンにしないでください。** DOC モードを使わない場合、`SELECT *` や `SELECT variant_col` は、すべてのサブカラムから大きな JSON を再構築する必要があり、`SELECT v['path']` のようにパスを指定する場合より大幅に遅くなります。
- **クエリが型に依存する場合は、必ずサブパスを CAST してください。** 型推論が想定と一致しない場合があります。`v['id']` が実際には STRING として格納されているのに整数リテラルと比較すると、インデックスが使われず、結果が誤る可能性があります。

### 運用時

- **コンパクションの負荷を監視してください。** サブカラムが増えるとマージコストも増えます。Compaction Score が上昇し続ける場合は、`variant_max_subcolumns_count` が大きすぎないか、取り込み速度が速すぎないかを確認してください。
- **スキーマの変化を監視してください。** JSON の構造が頻繁に変わると、よく使うパスがスパースストレージに移され、クエリが突然遅くなることがあります。重要なパスは Schema Template で固定してください。
- **型の競合を監視してください。** 同じパスで型の競合が頻発する場合は、JSONB への昇格とインデックスの喪失を避けるため、そのパスを Schema Template で固定する必要があります。

## 簡単な確認方法

テーブルを作成した後、次の最小限の手順で動作を確認してください。

```sql
-- Insert sample data
INSERT INTO event_log VALUES
    ('2025-01-01 10:00:00', 1001, 'click', '{"page": "home", "user_id": 42, "duration_ms": 320}'),
    ('2025-01-01 10:00:01', 1002, 'purchase', '{"item": "widget", "price": 9.99, "user_id": 42}'),
    ('2025-01-01 10:00:02', 1003, 'click', '{"page": "search", "user_id": 99, "query": "doris variant"}');

-- Verify data
SELECT payload['user_id'], payload['page'] FROM event_log;

-- Check Subcolumnization results
SET describe_extend_variant_column = true;
DESC event_log;

-- Check per-row types
SELECT variant_type(payload) FROM event_log;
```

## 関連資料

- [VARIANT](./VARIANT)
- [VARIANT データのインポート](../../../../data-operate/import/complex-types/variant)
- [ストレージフォーマット V3](../../../../table-design/storage-format)
- [SEARCH 関数](../../../../table-design/index/inverted-index/search-function.md)
