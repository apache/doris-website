---
{
    "title": "VARIANT ワークロードガイド",
    "language": "ja",
    "description": "VARIANT を使う場面、デフォルト・スパースカラム・DOC モード・スキーマテンプレートの選び方、および設定の始め方を判断するためのガイドです。"
}
---

## 概要

`VARIANT` は半構造化 JSON を格納し、頻繁に使うパスをサブカラム化します。

新しい `VARIANT` ワークロードのデータモデルを検討するときに、このガイドを使用してください。次のような疑問に答えます。

- このワークロードには `VARIANT` と静的カラムのどちらを使うべきか。
- JSON の幅が非常に広い場合、デフォルトの動作、スパースカラム、DOC モードのどれから始めるべきか。
- どの設定をデフォルトのままにし、どの設定を最初に変更すべきか。

`VARIANT` を使うことが決まっていて、構文や型の規則だけを確認したい場合は、[VARIANT](./VARIANT.md) を参照してください。実行可能な最小のインポート例が必要な場合は、[VARIANT データのインポート](../../../../data-operate/import/complex-types/variant.md) を参照してください。

:::tip VARIANT を選ぶ理由
`VARIANT` は JSON の柔軟性を保ちながら、頻繁に使うパスを Doris がサブカラム化できます。そのため、ドキュメント全体のスキーマを事前に固定せずに、よく使うフィルター、集計、パス単位のインデックスを効率よく利用できます。幅が非常に広い JSON でも、ストレージ層の最適化により、はるかに多くのパスを実用的にサブカラム化できます。
:::

## VARIANT が適するケース

次の条件の多くに当てはまる場合、通常は `VARIANT` が適しています。

- 入力が JSON、またはフィールドが時間とともに変化する別の半構造化データである。
- クエリは通常、各行のすべてのフィールドではなく、頻繁に使う一部のパスだけを参照する。
- カラム指向分析の性能を維持しながら、スキーマの柔軟性を確保したい。
- 一部のパスにはインデックスが必要だが、ほかの多くのパスは動的なままでよい。

次の条件が中心となる場合は、静的カラムを優先してください。

- スキーマが安定しており、事前に分かっている。
- 主要なフィールドを結合キー、ソートキー、または型を厳密に管理するカラムとして常用する。VARIANT の値も結合やソートに使用できますが、型付きカラムのほうが高速で、型のセマンティクスも維持できます。
- 主な目的がパス単位の分析ではなく、生の JSON の保管である。

## 最初に確認する四つの質問

設定を変更する前に、次の四つの質問に答えてください。

### 1. 頻繁に使うパスは明確か

クエリが同じ JSON パスを繰り返し参照する場合、Doris はそれらのパスをサブカラム化できます。このような場合に `VARIANT` の効果が最も高くなります。

### 2. 固定の型や安定したインデックスが必要なパスは少数か

その場合は、そのパスだけにスキーマテンプレートを使用します。スキーマテンプレートは、ビジネス上重要な少数のフィールド向けであり、ドキュメント全体を記述するためのものではありません。

### 3. JSON の幅は実際に広くなっているか

パス数が増え続け、メタデータやコンパクションへの負荷、または目に見えるクエリのオーバーヘッドが生じ始めたら、幅の広い JSON の問題が発生しています。

### 4. 幅の広い JSON では、頻繁に使うパスの分析とドキュメント全体の返却のどちらが重要か

- 主な用途が、頻繁に使うフィールドのパス単位のフィルタリング、集計、インデックスである場合は、スパースカラムを選ぶ方向で検討します。
- 主な用途が取り込み効率、またはドキュメント全体の返却である場合は、DOC モードを選ぶ方向で検討します。

## 主な概念

以下のストレージモードを読む前に、次の用語を確認してください。それぞれを 2-3 行で説明します。実装の詳細は [VARIANT](./VARIANT.md) を参照してください。

**サブカラム化。** データを `VARIANT` カラムに書き込むと、Doris は JSON パスを自動的に検出し、頻繁に使うパスを独立したカラム指向のサブカラムとして抽出して、効率的な分析を可能にします。

<img src="/images/variant/variant-default-storage.png" alt="デフォルトの VARIANT：サブカラムの自動抽出" width="720" />

**スキーマテンプレート。** `VARIANT` カラム上で、選択したパスの型を固定する宣言です。型、インデックス、動作の予測可能性を維持する必要がある主要な業務フィールドに使用します。考えられるすべてのパスを列挙しないでください。

**幅の広い JSON。** 個別のパスの数が増え続け、メタデータのサイズ、書き込みコスト、コンパクションのコスト、またはクエリのコストが増え始めた状態です。

**スパースカラム。** 幅の広い JSON で、頻繁に使うパスと使わないパスが明確に分かれる場合、前者をサブカラム化し、後者のロングテールに属するパスを共有のスパースストレージに移します。スパースストレージは、複数の物理カラムへのシャーディングをサポートし、読み取りの並列性を高めます。

<img src="/images/variant/variant-sparse-storage.png" alt="スパースカラム：頻繁に使うパスと使わないパスの分離" width="720" />

上図のように、頻繁に使うパス（`user_id`、`page` など）は独立したカラム指向のサブカラムとして残り、分析性能を維持します。一方、数千に及ぶロングテールのパスは共有のスパースストレージに集約されます。このしきい値は `variant_max_subcolumns_count` で制御します。

**スパースシャーディング。** ロングテールのパス数が非常に多い場合、単一のスパースカラムが読み取りのボトルネックになることがあります。スパースシャーディングは、ロングテールのパスをハッシュによって複数の物理カラムに分散し（`variant_sparse_hash_shard_count`）、並列スキャンを可能にします。

<img src="/images/variant/variant-sparse-sharding.png" alt="スパースシャーディング：ロングテールのパスを並列に読み取る" width="720" />

**DOC モード。** 書き込み時のサブカラム化を遅らせ、さらに元の JSON をマップ形式の格納フィールド（**doc map**）として保存します。ストレージの使用量は増えますが、高速な取り込みと効率的なドキュメント全体の返却が可能になります。サブカラム化は、その後のコンパクション時に行われます。

<img src="/images/variant/variant-doc-mode.png" alt="DOC モード：抽出の遅延とドキュメント全体の高速な返却" width="700" />

上図のように、書き込み時には JSON をそのまま Doc Store に保存するため、高速に取り込めます。サブカラムは後のコンパクション時に抽出されます。読み取り時には、パス単位のクエリ（`SELECT v['user_id']` など）は実体化されたサブカラムをカラム指向の速度で読み取り、ドキュメント全体のクエリ（`SELECT v`）はサブカラムから再構築せずに Doc Store から直接読み取ります。

DOC モードには、クエリ対象のパスが実体化されているかどうかに応じて、三つの異なる読み取り経路があります。

<img src="/images/variant/variant-doc-mode-readpaths.png" alt="DOC モード：読み取り経路の詳細" width="720" />

- **DOC Materialized**：クエリ対象のパスはすでにサブカラムとして抽出されています（コンパクション後、または `variant_doc_materialization_min_rows` の条件を満たしたとき）。デフォルトの VARIANT と同じく、カラム指向の速度で読み取れます。
- **DOC Map**：クエリ対象のパスはまだ実体化されていません。値を探すために doc map 全体をスキャンする方法に切り替わり、幅の広い JSON では大幅に遅くなります。
- **DOC Map (Sharded)**：同じ代替の読み取り経路ですが、`variant_doc_hash_shard_count` により doc map が複数の物理カラムに分散されるため、並列スキャンが可能になり、読み取り速度が大幅に改善します。

**ストレージフォーマット V3.** カラムのメタデータをセグメントフッターから分離します。数千のサブカラムがある場合のメタデータのボトルネックを解消するため、特に幅の広い JSON を含む、すべての `VARIANT` テーブルに推奨します。

## 推奨される選択手順

<img src="/images/variant/variant-decision-flowchart.png" alt="VARIANT モードの選択手順" width="520" />

## ストレージモード

次の表で最初の選択肢を決めてから、対応するセクションを読んでください。

| | 代表的なシナリオ | 推奨モード | 主な設定 |
|---|---|---|---|
| **A** | イベントログ、監査ログ | デフォルトの VARIANT + V3 | デフォルト設定を維持 |
| **B** | 広告、テレメトリー、ユーザープロファイル（幅が広く、頻繁に使うパスは少数） | スパースカラム + V3 | `variant_max_subcolumns_count`、`variant_sparse_hash_shard_count` |
| **C** | モデル出力、トレース、アーカイブ（取り込み優先、またはドキュメント全体の返却） | DOC モード + V3 | `variant_enable_doc_mode`、`variant_doc_materialization_min_rows` |
| **D** | 注文、決済、デバイス（主要なパスに安定した型が必要） | スキーマテンプレート + A または B | 主要なパスだけを定義 |

### デフォルトモード

新しい `VARIANT` ワークロードの多くでは、これが最も安全な出発点です。

代表例：クエリが少数の決まったパスを繰り返し参照するイベントログや監査データ。

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

ワークロードの幅がスパースカラムや DOC モードを使うほど広いかまだ分からず、主な価値が、よく使う複数のパスに対するフィルタリング、集計、グループ化にある場合に使用します。

注意点：
- パス数の増加がすでに負荷を生んでいる場合を除き、早い段階で `variant_max_subcolumns_count` を増やさないでください。
- JSON の幅が広くない場合、スパースカラムや DOC モードを有効にしても、メリットなく複雑さが増えます。

### スパースモード

データの幅は広いものの、ほとんどのクエリが頻繁に使う少数のパスに集中する場合は、スパースカラムを選びます。

代表例：任意の属性が数千個ある一方、日常的にクエリされるのは数十個だけの広告、テレメトリー、プロファイルの JSON。

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

キーの総数は非常に多いものの、主なワークロードが引き続きパス単位のフィルタリング、集計、インデックスである場合に使用します。

注意点：
- 頻繁に使うパスの分析がボトルネックなら、最初から DOC モードに切り替えないでください。
- `variant_max_subcolumns_count` のデフォルト値は `2048` で、ほとんどのワークロードでは自動サブカラム化の適切な出発点です。実質的にすべてのパスがサブカラム化されるほど大きな値には設定しないでください。ワークロードで非常に多くのサブカラムの抽出が本当に必要な場合は、[DOC モード](#doc-mode-template) を優先してください。

### DOC モード {#doc-mode-template}

パス単位の分析の最適化よりも、JSON ドキュメント全体の返却や、取り込み時のオーバーヘッドの削減が重要な場合は、DOC モードを選びます。

代表例：完全なデータとして返すことの多いモデルの応答、トレースのスナップショット、アーカイブされた JSON ドキュメント。

DOC モードが役立つケース：

- サブカラム化の規模が非常に大きくなると（パス数が 10,000 に近づくと）、ハードウェア要件が急速に高まります。この規模では DOC モードのほうが安定した選択肢です。
- デフォルトの即時サブカラム化と比べて、コンパクション時のメモリ使用量を約三分の二削減できます。
- スパースな幅広カラムの取り込みワークロードでは、スループットが約 5–10× に向上する場合があります。
- クエリが `VARIANT` 値全体を読み取る場合（`SELECT variant_col`）、DOC モードなら数千のサブカラムからドキュメントを再構築せずに済み、桁違いに高速になります。

**使い始めるには：**

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

取り込みスループットを最優先する場合、ワークロードで JSON ドキュメント全体を頻繁に取得する必要がある場合、または非常に幅の広いカラムを `SELECT variant_col` で読み取ることが多い場合に使用します。

注意点：
- DOC モードは、幅の広い JSON ワークロードすべてに適したデフォルトの選択肢ではありません。頻繁に使うパスの分析が中心なら、通常はスパースカラムのほうが適しています。
- DOC モードとスパースカラムは併用できません。同時に有効化することはできません。
- `DROP`、`RENAME`、コメントの変更を除き、スキーマテンプレートを持つカラムは変更できません。そのため、`variant_doc_materialization_min_rows` も後から変更できません。テーブル作成時に値を決めてください。

### スキーマテンプレート

少数のパスに安定した型、安定した動作、またはパス固有のインデックスが必要な場合は、スキーマテンプレートを選びます。

代表例：業務上重要な少数のパスの型を保ち、検索可能にする必要がある注文、決済、デバイスのデータ。

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

業務上重要なフィールドが少数で、そのパスにより厳密な型付けやパス単位のインデックス戦略が必要な場合に使用します。必要に応じて、スキーマテンプレートをスパースカラムやデフォルトの `VARIANT` と組み合わせてください。

注意点：
- JSON スキーマ全体を静的なテンプレートにしないでください。`VARIANT` を使う利点が失われます。
- スキーマテンプレートには主要なパスだけを含め、残りは動的なままにしてください。
- カラムの作成後にスキーマテンプレートを変更することはできません。本番データを読み込む前に主要なパスを決めてください。

## パフォーマンス

次のグラフは、10K パスの幅広カラムのデータセットで、単一パスの抽出時間を比較したものです（200K 行、一つのキーを抽出、16 CPU、3 回の実行の中央値）。

<img src="/images/variant/variant-bench-query-time.svg" alt="幅広カラムからの単一パス抽出：クエリ時間" width="720" />

| モード | クエリ時間 | ピークメモリ |
|---|---:|---:|
| DOC Materialized | 76 ms | 1 MiB |
| VARIANT Default | 76 ms | 1 MiB |
| DOC Map (Sharded) | 148 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| DOC Map | 2,533 ms | 1 MiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING（生の JSON） | 6,104 ms | 48 GiB |

主なポイント：

- **実体化されたサブカラムが最速です。** デフォルトモードと DOC Materialized はともに約 76 ms で、生の STRING より 80×、JSONB より 12× 高速です。
- **DOC Map のシャーディングが有効です。** 実体化されていないパスでは、doc map をシャーディングすることでクエリ時間が 2.5 s から 148 ms に短縮されます。
- **JSONB と STRING は多くのメモリを使用します。** ピークメモリ使用量は 32–48 GiB で、VARIANT モードの 1 MiB を大きく上回ります。

## ベストプラクティス

### インポート時

- **新しい `VARIANT` テーブルではストレージフォーマット V3 から始めます。** V3 はカラムのメタデータをセグメントフッターから分離します。使用しない場合、幅の広い JSON ワークロードではファイルを開く処理が遅くなり、メモリのオーバーヘッドが増えます。
- **主要なパスは早い段階でスキーマテンプレートに固定します。** スキーマテンプレートがない場合、システムは型を自動的に推論します。同じパスの型がバッチ間で変わると（整数から文字列など）、JSONB に昇格し、そのパスのインデックスが失われます。
- **デフォルト設定から始め、問題が現れてから調整します。** ほとんどのワークロードではデフォルト設定で十分です。AI の学習、コネクテッドカー、ユーザータグシステムなど、非常に多くのサブカラム化とパス単位のインデックスが必要な場合に限り、状況に応じて調整します。初日から過剰に設定すると（`variant_max_subcolumns_count` を非常に大きくする、不要な DOC モードを有効にするなど）、効果を示す根拠がないまま複雑さが増します。

### クエリ時

- **`SELECT *` を非常に幅の広い `VARIANT` カラムで主なクエリパターンにしないでください。** DOC モードを使わない場合、`SELECT *` や `SELECT variant_col` はすべてのサブカラムから大きな JSON を再構築する必要があるため、`SELECT v['path']` のようにパスを指定するよりも大幅に遅くなります。
- **フィルターではサブパスを格納時の型に CAST します。** `v['id'] = 123` のような比較ではパスが暗黙的にキャストされ、行ごとに評価されるため、ゾーンマップ、BloomFilter、インデックスは使用されません。パスが格納されている型に合わせて `CAST(v['id'] AS BIGINT) = 123` と記述します（型は `DESC` で確認できます。その前に `SET describe_extend_variant_column = true` を実行してください）。文字列パスと文字列リテラルを比較する場合、CAST は不要です。
- **どの比較方法が使われるかを把握します。** パスとリテラルの比較では、リテラルから選ばれた型にパスがキャストされます。一方、二つの VARIANT 値を比較する場合や、VARIANT 値をグループ化、結合、ソートする場合は、VARIANT のセマンティクスが使われます。数値は文字列より前に並び、`1` と `"1"` は決して等しくなりません。[比較、グループ化、並び順](./VARIANT.md#comparison-grouping-and-ordering) を参照してください。

### 運用時

- **コンパクションの負荷を監視します。** サブカラムが増えるとマージのコストが上がります。Compaction Score が上がり続ける場合は、`variant_max_subcolumns_count` が高すぎないか、取り込み速度が速すぎないかを確認してください。
- **スキーマドリフトを監視します。** JSON の構造が頻繁に変わると、よく使うパスがスパースストレージに移され、クエリが急に遅くなる可能性があります。重要なパスはスキーマテンプレートで固定してください。
- **型の競合を監視します。** 同じパスで型の競合が頻発する場合は、JSONB への昇格とインデックスの喪失を避けるため、そのパスをスキーマテンプレートで固定する必要があります。

## 簡単な確認

テーブル作成後、次の最小限の手順で動作を確認します。

```sql
-- Insert sample data. INSERT stores a plain string as a VARIANT string, so parse the JSON text.
INSERT INTO event_log VALUES
    ('2025-01-01 10:00:00', 1001, 'click', PARSE_TO_VARIANT('{"page": "home", "user_id": 42, "duration_ms": 320}')),
    ('2025-01-01 10:00:01', 1002, 'purchase', PARSE_TO_VARIANT('{"item": "widget", "price": 9.99, "user_id": 42}')),
    ('2025-01-01 10:00:02', 1003, 'click', PARSE_TO_VARIANT('{"page": "search", "user_id": 99, "query": "doris variant"}'));

-- Verify data
SELECT payload['user_id'], payload['page'] FROM event_log;

-- Check Subcolumnization results
SET describe_extend_variant_column = true;
DESC event_log;

-- Check the type of one path, row by row
SELECT variant_type(payload['user_id']) FROM event_log;
```

## 関連資料

- [VARIANT](./VARIANT.md)
- [VARIANT データのインポート](../../../../data-operate/import/complex-types/variant.md)
- [ストレージフォーマット V3](../../../../table-design/storage-format.md)
- [SEARCH 関数](../../../../table-design/index/inverted-index/search-function.md)
