---
{
    "title": "非同期マテリアライズドビューのベストプラクティス",
    "language": "ja",
    "description": "非同期マテリアライズドビューはどのような場合に適しているのでしょうか。リフレッシュ戦略をどう選び、どう実装すればよいのでしょうか。この記事では、適用シナリオの評価、利用原則、リフレッシュ戦略の選択、実装方法、運用上の考慮事項を説明します。",
    "keywords": ["非同期マテリアライズドビュー", "利用上の推奨事項", "ベストプラクティス", "リフレッシュ戦略", "増分ビュー保守", "IVM", "パーティション化マテリアライズドビュー", "透過的リライト", "データウェアハウスの階層モデリング", "Doris"]
}
---

<!-- Knowledge type: usage guide / best practices -->
<!-- Applicable scenarios: query acceleration, ETL data modeling, lakehouse federated query, write optimization -->

非同期マテリアライズドビューは、クエリ結果を事前に計算して保存することでクエリを高速化します。ただし、リフレッシュのたびに計算リソースと I/O が消費されます。この記事では、**適用シナリオの評価、利用原則、リフレッシュ戦略の選択、実装方法、運用上の考慮事項**を順に説明し、DBA と開発者が効率的な非同期マテリアライズドビューを構築できるようにします。

マテリアライズドビューのリフレッシュ原理については、[リフレッシュ原理](../overview.md)を参照してください。

## 判断のための簡易チェックリスト

非同期マテリアライズドビューを作成する前に、次の項目を確認してください。

- クエリに複数テーブルの JOIN、複雑な集約、またはウィンドウ関数が含まれていますか？
- ベーステーブルのデータ更新頻度は比較的低いですか（毎分複数回の更新は避ける）？
- 業務上、分単位以上のデータ遅延を許容できますか（1～5 分以内のリアルタイムデータは不要ですか）？
- ベーステーブルのデータ量は十分に大きいですか（数百行を大きく上回りますか）？
- よく使うクエリの SQL パターンを、グループ間で重複しないように分類できますか？
- ベーステーブルはパーティションテーブルで、パーティション化マテリアライズドビューを構築できますか？
- 定期的なリフレッシュに必要なリソースはありますか？
- マテリアライズドビューの利用状況を定期的に確認し、未使用のものを適時に削除できますか？

上記のほとんどに**はい**と答えられるなら、非同期マテリアライズドビューが適しています。

---

## 1. 適用シナリオの評価

<!-- Knowledge type: scenario assessment -->

以下の表に、非同期マテリアライズドビューを**推奨する**代表的なシナリオと**推奨しない**シナリオをまとめます。

### シナリオ早見表

| 分類 | シナリオ | 主な特徴 | 推奨 |
|---|---|---|---|
| クエリの複雑さ | 複雑な集約クエリ | 複数テーブルの JOIN、SUM/AVG/COUNT、ウィンドウ関数 | はい |
| レポート | 一貫したスナップショットによるレポート | 決まった時点（毎日午前零時など）に生成 | はい |
| 計算負荷 | 計算負荷の高い分析 | 複雑な数式、データ変換、予測モデル | はい |
| データウェアハウスのモデリング | スター／スノーフレークスキーマ | ファクトテーブルと複数のディメンションテーブルを JOIN | はい |
| レイクハウス | レイクハウスの高速化 | データレイクへのクエリがネットワークとオブジェクトストレージのスループットに制約される | はい |
| データウェアハウスの階層化 | ETL による階層処理 | ベーステーブルが生データで、複数階層の処理が必要 | はい |
| データ更新 | 頻繁に更新されるベーステーブル | 毎分複数回の更新 | いいえ |
| クエリの複雑さ | 単純なクエリ | 単一テーブルのスキャンまたは単純なフィルター | いいえ |
| 即時性 | ほぼリアルタイム（1～5 分以内）のデータ | 業務上、常に最新のデータが必要 | いいえ |
| データ量 | 非常に小さいソーステーブル | 数百行程度 | いいえ |

### 推奨するシナリオ

#### 複雑な集約クエリ

- **説明**: 複数テーブルの結合、複雑な集約関数（SUM、AVG、COUNT など）、またはウィンドウ関数を含むクエリ。
- **利点**: 実行のたびに複雑なロジックを再計算せずに済みます。

#### レポート

- **説明**: 決まった時点（毎日午前零時など）に生成される、一貫したスナップショットが必要なレポート。
- **利点**: すべてのユーザーが同じ時点のデータを参照できます。

#### 計算負荷の高い分析

- **説明**: 顧客生涯価値の計算や予測分析モデルなど、複雑な数式やデータ変換を伴う分析クエリ。
- **利点**: 結果を事前に計算し、クエリ実行時のリソース消費を抑えます。

#### データウェアハウスのスター／スノーフレークスキーマ

- **説明**: 売上ファクトテーブルと商品、時間、地域のディメンションテーブルとの結合など、ファクトテーブルが複数のディメンションテーブルを結合するシナリオ。
- **利点**: 結合結果を事前に実体化し、分析クエリを高速化します。

#### レイクハウスの高速化

- **説明**: データレイクへのクエリは、ネットワーク遅延やオブジェクトストレージのスループット制限によって低速になる場合があります。
- **利点**: Doris のローカルストレージによる高速化を利用して、データレイクの分析を高速化します。

#### データウェアハウスの階層化

- **説明**: ベーステーブルに大量の生データがあり、クエリに複雑な ETL 処理が必要なシナリオ。
- **利点**: データ上に複数階層の非同期マテリアライズドビューを構築し、データウェアハウスの階層化を実現します。

### 推奨しないシナリオ

#### 頻繁に更新されるベーステーブル

- **説明**: ソーステーブルのデータが非常に頻繁に変化する場合（毎分複数回の更新など）。
- **問題点**: 全件リフレッシュやパーティション単位のリフレッシュではコストが高すぎる可能性があります。毎回変更される行がテーブルまたはパーティションのごく一部なら、[増分ビュー保守（IVM）](incremental-materialized-view)を検討してください。IVM も非同期でリフレッシュされ、リアルタイムの一貫性は提供しません。

#### 単純なクエリ

- **説明**: 単一テーブルのスキャンまたは単純なフィルタリングだけを行うクエリ。
- **問題点**: 非同期マテリアライズドビューによる利点がリフレッシュのコストに見合いません。

#### リアルタイムデータ（1～5 分以内）が必要なシナリオ

- **説明**: 業務上、常に最新のデータが必要な場合。
- **問題点**: 非同期マテリアライズドビューにはデータ遅延があります。

#### 非常に小さいソーステーブル

- **説明**: ベーステーブルのレコード数が少ない場合（数百行など）。
- **問題点**: 非同期マテリアライズドビューによる最適化の効果は大きくありません。

---

## 2. 利用原則

<!-- Knowledge type: principles and constraints -->

### 2.1 非同期マテリアライズドビューを使用する場面

| 観点 | 説明 |
| --- | --- |
| 即時性 | T+1 データなど、データの即時性がそれほど重要でないシナリオに適しています。即時性が重要な場合は、同期マテリアライズドビューを使用します。 |
| 高速化と一貫性 | よく使うクエリの SQL パターンを、グループ間の重複をできるだけ少なくして分類します。分類が明確なほど、構築の質が高まります。 |
| 再利用性 | 一つのクエリで複数のマテリアライズドビューを利用でき、一つのマテリアライズドビューを複数のクエリで利用できます。 |
| トレードオフ | マテリアライズドビューを利用した場合の応答時間（高速化）、構築コスト、データ一貫性の要件を総合的に検討します。 |

### 2.2 マテリアライズドビューの定義と構築コストのトレードオフ

- **元のクエリに近い定義**: 高い高速化効果を得られますが、汎用性と再利用性が低く、構築コストは高くなります。
- **より汎用的な定義**（WHERE 条件を付けない、集約ディメンションを増やすなど）: 高速化効果は低くなりますが、汎用性と再利用性が高く、構築コストは低くなります。

:::caution 注意

- **マテリアライズドビューの数を抑える**: 数を増やせばよいわけではありません。構築とリフレッシュにリソースを消費し、透過的リライトでは CBO が最適なマテリアライズドビューを選ぶためにも時間がかかります。理論上、数が増えるほど透過的リライトの所要時間も長くなります。
- **利用状況を定期的に確認する**: 使用されていないマテリアライズドビューは適時に削除してください。
- **ベーステーブルの更新頻度**: ベーステーブルが頻繁に更新されると、マテリアライズドビューは頻繁に無効化され、透過的リライトに利用できなくなります（直接のクエリは可能です）。この状況で透過的リライトを利用するには、クエリ結果に一定の遅延を許容する必要があります。`grace_period` で設定できます。詳細は `grace_period` の説明を参照してください。

:::

---

## 3. リフレッシュ戦略の選択

<!-- Knowledge type: decision guide -->

非同期マテリアライズドビューでは、計算の粒度とトリガー方法をそれぞれ選択します。計算の粒度には `INCREMENTAL`、`PARTITIONS`、`COMPLETE`、`AUTO` があり、トリガー方法には手動リフレッシュ、スケジュールリフレッシュ、トリガーによるリフレッシュがあります。

| 計算の粒度 | 推奨シナリオ |
|---|---|
| `INCREMENTAL` | 変更行数がテーブル全体や影響を受けるパーティションに比べて非常に少なく、定義が IVM の要件を満たす場合 |
| `PARTITIONS` | 変更が少数のパーティションに集中し、それらの再計算にかかるコストを許容できる場合 |
| `COMPLETE` | データ量が少ない場合、初回のベースライン構築時、またはベースラインの復旧時 |
| `AUTO` | Doris に利用可能な方法を自動選択させたい場合 |

IVM は Doris 5.0.0 以降で利用でき、現在は実験的な機能です。選択の目安、前提条件、制限事項については、[増分ビュー保守（IVM）](incremental-materialized-view)を参照してください。

### 3.1 パーティション化マテリアライズドビューを優先する {#31-prefer-partitioned-materialized-views}

次の条件をすべて満たす場合、パーティション化マテリアライズドビューの構築を推奨します。

1. マテリアライズドビューのベーステーブルはデータ量が多く、パーティションテーブルである。
2. マテリアライズドビューが参照する非パーティションテーブルは頻繁に変更されない。
3. マテリアライズドビューの定義 SQL とパーティションフィールドが、パーティションの導出要件（つまり、パーティション単位の増分更新要件）を満たす。詳細は [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters) を参照してください。
4. マテリアライズドビューのパーティション数が多すぎない。パーティションが多すぎると構築に非常に長い時間がかかります。

> マテリアライズドビューの一部のパーティションが無効化されても、透過的リライトでは有効なパーティションとベーステーブルを UNION ALL で組み合わせて結果を返せます。

パーティション化マテリアライズドビューを構築できない場合は、**全件リフレッシュ**を行うマテリアライズドビューを検討してください。

### 3.2 三つのリフレッシュ戦略の比較 {#32-comparison-of-the-three-refresh-strategies}

| リフレッシュ戦略 | トリガー方法 | データの鮮度 | 自動化の度合い | 主なリスク |
|---|---|---|---|---|
| 手動リフレッシュ | ユーザーの明示的なコマンドまたは外部スケジューリング | 低い（スケジュールに依存） | 低い | スケジュールを自分で管理する必要がある |
| スケジュールリフレッシュ | 一定間隔（最小単位は分） | 中程度（遅延を予測可能） | 中程度 | 高頻度にするとリソースを継続的に占有する |
| トリガーによるリフレッシュ | ベーステーブルのデータ変更時に自動起動 | 高い | 高い | リフレッシュが連鎖的に大量発生する可能性がある |

### 3.3 各リフレッシュ戦略の詳細

#### 手動リフレッシュ

- **仕組み**: ユーザーの明示的なコマンド、または外部システムのスケジュールによって起動します。
- **適用シナリオ**:
    - リアルタイム性の要件が低いレポートシステム
    - データウェアハウスでの履歴データ分析
    - 特定の業務プロセスに合わせてリフレッシュする必要がある場合
    - システムリソースの調整が必要な大規模データのリフレッシュ
- **長所**: リフレッシュのタイミングを完全に制御でき、業務のピーク時間帯を避けられます。
- **短所**: リフレッシュのスケジュールを別途管理する必要があります。外部処理のループがリフレッシュを繰り返し起動しないよう、十分な耐障害性も必要です。

#### スケジュールリフレッシュ

- **仕組み**:
    - 一定間隔で自動的にリフレッシュします
    - 最小の時間単位は分です
    - 初回タスクの開始時刻を指定できます
- **適用シナリオ**:
    - 定期的な業務指標の監視
    - 階層化されたデータパイプライン
    - 階層ごとに即時性の要件が異なるレポートシステム
    - 定期的に変動するソースデータ
- **長所**: データ遅延を予測できる定期的な処理が可能です。
- **短所**: データの鮮度には限界があり、関連ビューのリフレッシュ順序を手動で調整する必要があります。
- **設定上の制約**: リアルタイム性を高めるために、すべてのマテリアライズドビューを高頻度のスケジュールリフレッシュに設定することは推奨しません。次の問題が生じるためです。
    - システムリソースの継続的な占有
    - リフレッシュジョブ間でのリソース競合
    - パーティション／タブレットの頻繁な追加と削除による BE への大きな負荷

#### トリガーによるリフレッシュ

- **仕組み**: ベーステーブルのデータが変更されると、自動的にリフレッシュが起動します。
- **適用シナリオ**:
    - 複数階層のマテリアライズドビュー構成における上位階層のビュー
    - ベーステーブルの変更頻度が低い場合
- **長所**: データの鮮度が高く、自動化の度合いも高くなります。
- **短所**: リフレッシュが連鎖的に大量発生する可能性があり、システム負荷を予測しにくくなります。
- **設定上の制約**: 次の場合を除き、ベース階層のマテリアライズドビューでトリガーによるリフレッシュを使用することは推奨しません。
    - ベーステーブルの更新頻度が低いことを確認できる場合（数十分ごとに変更されるなど）

### 3.4 リフレッシュ戦略の組み合わせに関する推奨事項 {#34-recommendations-for-combining-refresh-strategies}

#### データウェアハウスの階層別

| ビューの階層 | 推奨するリフレッシュ戦略 |
|---|---|
| ベース階層 | スケジュールリフレッシュ（毎時など） |
| 中間階層 | スケジュールリフレッシュまたはトリガーによるリフレッシュ |
| 提供階層 | トリガーによるリフレッシュまたは手動リフレッシュ |

#### 業務上の重要度別

| 業務レベル | 推奨戦略 |
|---|---|
| 即時性が重要な業務データ | 非同期マテリアライズドビューは推奨しません |
| 一般的な分析データ | スケジュールリフレッシュ（毎日／毎時） |
| 履歴／アーカイブデータ | 手動リフレッシュ |

#### データ変更の頻度別

| 変更頻度 | 推奨戦略 |
|---|---|
| 高頻度の変更 | 間隔を長くしたスケジュールリフレッシュ、または手動リフレッシュ |
| 低頻度の変更 | トリガーによるリフレッシュ、または間隔を短くしたスケジュールリフレッシュ |
| バッチによる変更 | 変更後に手動でリフレッシュ |

### 3.5 リフレッシュ頻度の推奨値

以下は一般的な推奨値です。実際の設定は、システムリソース、非同期マテリアライズドビューの数、その他の業務によるリソース使用量も踏まえて判断してください。

| 実際のリフレッシュ所要時間 | 推奨リフレッシュ間隔 |
|---|---|
| 15 秒未満 | 5 分以上 |
| 10 分未満 | 1 時間以上 |
| 1 時間未満 | 1 日以上 |

---

## 4. パーティション化マテリアライズドビューの実践

<!-- Applicable scenarios: large partitioned base tables -->

### 4.1 パーティションのマッピング関係

マテリアライズドビューのパーティションは、ベーステーブルのパーティションをマッピングして作成されます。通常、両者の関係は 1:1 または 1:n です。パーティションの導出要件の詳細は、[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters) と [非同期マテリアライズドビュー FAQ の Q12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-a-partition-materialized-view) を参照してください。

### 4.2 パーティションの無効化とリフレッシュの動作

| トリガー | 影響 | 対応 |
| --- | --- | --- |
| ベーステーブルのパーティション内のデータが変更された場合（挿入、削除など） | 対応するマテリアライズドビューのパーティションが無効になります。無効なパーティションは透過的リライトには利用できませんが、直接クエリすることは可能です。透過的リライトでは、無効なパーティションに該当するデータをベーステーブルとともに使用してクエリに応答します | `SHOW PARTITIONS FROM mv_name` でパーティションの状態を確認します |
| 参照している非パーティションテーブルのデータが変更された場合 | マテリアライズドビューのすべてのパーティションが無効になり、透過的リライトに利用できなくなります | `REFRESH MATERIALIZED VIEW mv1 AUTO;` を実行し、データが変更されたすべてのパーティションをリフレッシュします |
| 参照している非パーティションテーブルで挿入のみ行い、既存データを変更しない場合 | デフォルトではすべてのパーティションが無効になります | 作成時に `excluded_trigger_tables = 'non_partitioned_table_name1,non_partitioned_table_name2'` を指定します。次回のリフレッシュでは、パーティションテーブルに対応する無効なパーティションだけがリフレッシュされます |

> **設計上の推奨事項**: 変更頻度の高いデータを持つテーブルは、パーティション化マテリアライズドビューが参照するパーティションテーブルに配置し、変更頻度の低いディメンションテーブルは参照されないパーティション位置に配置します。

### 4.3 パーティション単位の透過的リライト

パーティション化マテリアライズドビューの透過的リライトは、**パーティション単位**で動作します。

- マテリアライズドビューの一部のパーティションが無効になっていても、透過的リライトに利用できます。
- ただし、クエリが一つのパーティションだけを対象とし、そのパーティションが無効な場合、この透過的リライトにはマテリアライズドビューを利用できません。

### 4.4 完全な例

**目的**: 日単位の集約クエリを高速化するため、日単位でパーティション化されたマテリアライズドビューを構築します。

**ステップ 1**: 日単位でパーティション化されたベーステーブル `lineitem` を作成し、ディメンションテーブル `partsupp` を準備します。

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL, 
    l_partkey INTEGER NOT NULL, 
    l_suppkey INTEGER NOT NULL, 
    l_linenumber INTEGER NOT NULL, 
    l_ordertime DATETIME NOT NULL, 
    l_quantity DECIMALV3(15, 2) NOT NULL, 
    l_extendedprice DECIMALV3(15, 2) NOT NULL, 
    l_discount DECIMALV3(15, 2) NOT NULL, 
    l_tax DECIMALV3(15, 2) NOT NULL, 
    l_returnflag CHAR(1) NOT NULL, 
    l_linestatus CHAR(1) NOT NULL, 
    l_shipdate DATE NOT NULL, 
    l_commitdate DATE NOT NULL, 
    l_receiptdate DATE NOT NULL, 
    l_shipinstruct CHAR(25) NOT NULL, 
    l_shipmode CHAR(10) NOT NULL, 
    l_comment VARCHAR(44) NOT NULL
) DUPLICATE KEY(
    l_orderkey, l_partkey, l_suppkey, 
    l_linenumber
) PARTITION BY RANGE(l_ordertime) (
    FROM 
      ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES      
(1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
(1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
(2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy');

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES     
(2, 3, 9, 10.01, 'supply1'),     
(4, 3, 9, 10.01, 'supply2'),     
(5, 6, 9, 10.01, 'supply3'),     
(6, 5, 10, 11.01, 'supply4');
```

**ステップ 2**: 日単位で集約する典型的なクエリを実行します。

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```

**ステップ 3**: ベーステーブルと同じ日単位のパーティション粒度で、データを日別に集約するマテリアライズドビューを構築します。

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

### 4.5 直近のパーティションデータのみを保持する

:::tip ヒント
この機能は Apache Doris 2.1.1 以降でサポートされています。
:::

マテリアライズドビューで直近の数パーティションのデータのみを保持し、リフレッシュのたびに期限切れのパーティションデータを自動削除できます。次のプロパティで設定します。

| プロパティ | 説明 |
| --- | --- |
| `partition_sync_limit` | ベーステーブルのパーティションフィールドが時間型の場合、ベーステーブルから同期するパーティションの範囲を設定します（`partition_sync_time_unit` と併用）。たとえば、`3` に設定し、単位を `DAY` にすると、直近 3 日分のパーティションとデータのみを同期します |
| `partition_sync_time_unit` | パーティションのリフレッシュに使用する時間単位。`DAY`／`MONTH`／`YEAR` をサポートし、デフォルトは `DAY` です |
| `partition_date_format` | ベーステーブルのパーティションフィールドが文字列の場合に、`partition_sync_limit` の機能を使用するために必要な日付形式 |

以下のマテリアライズドビューは、直近 3 日分のデータのみを保持します。直近 3 日間にデータがなければ、マテリアライズドビューを直接クエリしてもデータは返りません。

```sql
CREATE MATERIALIZED VIEW latest_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
PROPERTIES (
  "partition_sync_limit" = "3", 
  "partition_sync_time_unit" = "DAY", 
  "partition_date_format" = "yyyy-MM-dd"
)       
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') AS order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  AND l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

---

## 5. マテリアライズドビューによるクエリの高速化

<!-- Knowledge type: operational guide -->

### 5.1 基本的な手順

マテリアライズドビューでクエリを高速化するには、次の手順に従います。

1. プロファイルファイルを確認し、クエリ内で最も時間がかかる演算を特定します。一般的なボトルネックは Join、Aggregate、Filter、または計算式です。
2. ボトルネックとなる演算に対応するマテリアライズドビューを構築します。たとえば、Join が多くの計算リソースを消費し、Aggregate の負荷が比較的小さい場合は、Join を対象とするマテリアライズドビューを構築します。

### 5.2 四種類の演算に対する構築上の推奨事項

#### 5.2.1 Join の場合

- クエリで共通して使用されるテーブル結合のパターンを抽出し、マテリアライズドビューを構築します。ヒットしたクエリでは Join の計算を省けます。
- より汎用的な Join マテリアライズドビューを得るために、**クエリのフィルターを除外します**。

#### 5.2.2 Aggregate の場合

- 集約後のデータ量を抑えるため、**カーディナリティの低いフィールド**をマテリアライズドビューのディメンションとして使用します。
- マテリアライズドビューの集約粒度はクエリより細かくします（つまり、マテリアライズドビューの集約ディメンションにクエリの集約ディメンションを含めます）。また、マテリアライズドビューの集約関数にもクエリで使用する集約関数を含めます。

**カーディナリティ評価の例**:

- テーブル `t1` には 1,000,000 行があり、クエリに `GROUP BY a, b, c` が含まれるとします。
    - a、b、c のカーディナリティがそれぞれ 100、50、15 の場合、集約結果は約 75,000 行です。**マテリアライズドビューは有効です**。
    - a、b、c に相関がある場合、集約後のデータ量はさらに小さくなります。
    - c のカーディナリティが 3,500 の場合、集約結果は約 17,000,000 行となり、元のテーブルより多くなります。**マテリアライズドビューは適しません**。

#### 5.2.3 Filter の場合

- クエリが同じフィールドで頻繁にフィルタリングする場合は、対応するフィルターをマテリアライズドビューに追加してデータ量を減らします。
- **マテリアライズドビューのフィルター条件はクエリより緩く**し、クエリのフィルター条件がマテリアライズドビューのフィルター条件を含意するようにします。

たとえば、クエリの条件が `a > 10 AND b > 5` の場合は次のようにします。

- マテリアライズドビューにはフィルターを付けない。
- または、`a > 5 AND b > 5` や `a > 5` など、より広い範囲のフィルターを付ける。

#### 5.2.4 計算式の場合

- `CASE WHEN` や文字列処理など、計算コストの高い式を事前計算すると、クエリ性能を大きく改善できます。
- 一つのマテリアライズドビューに含める列を増やしすぎないようにします。クエリの SQL パターンごとに分類し、グループ別にマテリアライズドビューを構築します。

**集約クエリの高速化に関する完全な例**:

クエリ 1:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_partkey;
```

クエリ 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey;
```

上記のクエリに対しては、より汎用的な集約マテリアライズドビューを構築します。`l_partkey` と `l_suppkey` の両方を集約ディメンションに含め、`o_orderdate` をフィルター条件として使用します。注意: `o_orderdate` はマテリアライズドビューの条件補完に使用するだけでなく、集約ディメンションにも含める必要があります。これにより、クエリ 1 とクエリ 2 の両方がマテリアライズドビューにヒットします。

```sql
CREATE MATERIALIZED VIEW common_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate;
```

---

## 6. 代表的なユースケース

<!-- Knowledge type: scenario examples -->

### 6.1 シナリオ 1: クエリの高速化

**適用シナリオ**: BI レポートなど、クエリ応答時間に敏感で、数秒以内に結果を得る必要がある場合です。複数テーブルの Join とそれに続く集約は多くの計算リソースを消費するため、応答時間の要件を満たしにくくなります。非同期マテリアライズドビューは直接クエリと透過的リライトの両方をサポートします。オプティマイザーは、リライトアルゴリズムとコストモデルに基づいて最適なマテリアライズドビューを自動選択します。

#### ユースケース 1: 複数テーブルの結合と集約を行うクエリの高速化

より汎用的なマテリアライズドビューを構築し、複数テーブルの結合と集約を行うクエリを高速化します。

**目的**: 以下の三つのクエリすべてに対応する一つのマテリアライズドビューを構築します。

クエリ 1:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01';
```

クエリ 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

クエリ 3:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**構築案 1**: 汎用的な Join マテリアライズドビューを構築します。クエリ 1 とクエリ 2 のフィルター条件を除外し、`l_extendedprice * (1 - l_discount)` を事前計算します。

```sql
CREATE MATERIALIZED VIEW common_join_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**構築案 2**: 上記のマテリアライズドビューではクエリ 2 の高速化要件を満たせない場合、集約マテリアライズドビューを追加で構築します。汎用性を保つため、`o_orderdate` に対するフィルターは除外します。

```sql
CREATE MATERIALIZED VIEW target_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

#### ユースケース 2: ログクエリの高速化

**適用シナリオ**: ベーステーブルは通常、時間単位でパーティション化されており、クエリは主に時間と識別子フラグでフィルタリングする単一テーブルの集約です。応答速度が十分でない場合は、**非同期マテリアライズドビューと同期マテリアライズドビューを併用できます**。

**ステップ 1**: ベーステーブルを定義します。

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT 'identifier', 
`event_id` VARCHAR(128) NULL COMMENT 'identifier', 
`decision` VARCHAR(32) NULL COMMENT 'enum value', 
`time` DATETIME NULL COMMENT 'query time', 
`id` VARCHAR(35) NOT NULL COMMENT 'id', 
`code` VARCHAR(64) NULL COMMENT 'identifier', 
`event_type` VARCHAR(32) NULL COMMENT 'event type' 
)
DUPLICATE KEY(app_name, event_id)
PARTITION BY RANGE(time)                                    
(                                                                                                                                      
    FROM ("2024-07-01 00:00:00") TO ("2024-07-15 00:00:00") INTERVAL 1 HOUR                                                                     
)     
DISTRIBUTED BY HASH(event_id)
BUCKETS 3;
```

**ステップ 2**: 分単位で集約するマテリアライズドビューを構築し、一定程度までデータ量を削減します。

```sql
CREATE MATERIALIZED VIEW sync_mv
AS
SELECT 
  decision,
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  DATE_FORMAT(
    `time`, '%Y-%m-%d'
  ), 
  cast(FLOOR(MINUTE(time) / 15) AS decimal(9, 0)),
  count(id) AS cnt
FROM 
  test 
GROUP BY 
  code, 
  app_name, 
  event_id, 
  event_type, 
  date_trunc(time, 'minute'), 
  decision, 
  DATE_FORMAT(time, '%Y-%m-%d'), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

**ステップ 3**: 典型的なクエリを実行します。

```sql
SELECT 
    decision, 
    CONCAT(
        CONCAT(
          DATE_FORMAT(
            `time`, '%Y-%m-%d'
          ), 
          '', 
          LPAD(
            cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) AS time, 
      count(id) AS cnt 
FROM 
  test 
WHERE 
  date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
  AND '2024-07-03 20:00:00' 
GROUP BY 
  decision, 
  DATE_FORMAT(
    `time`, "%Y-%m-%d"
  ), 
  cast(FLOOR(MINUTE(`time`) / 15) AS decimal(9, 0));
```

### 6.2 シナリオ 2: データモデリング（ETL）

**適用シナリオ**: データ分析では複数テーブルの結合と集約が必要になることが多く、複雑なクエリを繰り返すと遅延やリソース消費が増大します。非同期マテリアライズドビューを使用して、階層化されたデータモデルを構築します。既存のマテリアライズドビューの上に、さらに上位階層のマテリアライズドビューを構築できます（2.1.3 以降でサポート）。

**階層ごとのトリガー方法の選択**:

- 第一階層をスケジュールリフレッシュ、第二階層をトリガーによるリフレッシュにする: 第一階層のリフレッシュが完了すると、第二階層が自動的に起動します。
- すべての階層でスケジュールリフレッシュを使用する: 第二階層のリフレッシュ時には、第一階層がベーステーブルと同期しているかどうかは考慮されず、第一階層のデータだけが処理され、第二階層に同期されます。

以下の例では、TPC-H データセットを使用して、地域と国ごとの月間注文数と利益を分析します。

**元のクエリ（マテリアライズドビューなし）**:

```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') AS month,
count(distinct o.o_orderkey) AS order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) AS revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```

**ステップ 1**: DWD 階層（明細データ）の注文詳細ワイドテーブルを構築します。

```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name AS nation_name,
r.r_name AS region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
FROM orders o
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
JOIN lineitem l ON o.o_orderkey = l.l_orderkey;
```

**ステップ 2**: DWS 階層（集計データ）の日次注文サマリーを構築します。

```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
date_trunc(o_orderdate, 'month') AS month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) AS order_count,
sum(l_extendedprice * (1 - l_discount)) AS net_revenue
FROM dwd_order_detail
GROUP BY
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```

**ステップ 3**: マテリアライズドビューを使用してクエリを最適化します。

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) AS revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```

### 6.3 シナリオ 3: レイクハウスのフェデレーションクエリ

**適用シナリオ**: 現代のデータアーキテクチャでは、ストレージコストとクエリ性能のバランスを取るためにレイクハウス設計がよく採用されます。このアーキテクチャには、主に次の二つの課題があります。

- **クエリ性能の制約**: データレイクへの頻繁なクエリは、ネットワーク遅延やサードパーティーのサービスの影響を受け、応答が遅くなります。
- **複雑な階層化データモデリング**: データレイクからリアルタイムデータウェアハウスへデータを移動・変換するには、通常、保守コストの高い複雑な ETL が必要です。

**Doris の非同期マテリアライズドビューによる解決方法**:

- **透過的リライトによるクエリの高速化**: よく使われるデータレイクのクエリ結果を Doris の内部ストレージに実体化し、透過的リライトでクエリ性能を改善します。
- **階層化モデリングの簡素化**: データレイク内のテーブル上にマテリアライズドビューを作成できるため、データレイクからリアルタイムデータウェアハウスへの変換が容易になります。

以下では Hive を例に説明します。

**ステップ 1**: Hive を基に Catalog を作成します（TPC-H データセットを使用）。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

**ステップ 2**: Hive Catalog を基にマテリアライズドビューを作成します。

```sql
-- Materialized views can only be created on the internal catalog. Switch to the internal catalog
SWITCH internal;
CREATE DATABASE hive_mv_db;
USE hive_mv_db;

CREATE MATERIALIZED VIEW external_hive_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 12
AS
SELECT
n_name,
o_orderdate,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
GROUP BY
n_name,
o_orderdate;
```

**ステップ 3**: クエリを実行し、マテリアライズドビューによる透過的リライトで自動的に高速化します。

```sql
SELECT
n_name,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
AND o_orderdate >= DATE '1994-01-01'
AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
GROUP BY
n_name
ORDER BY
revenue DESC;
```

:::tip ヒント

現在、Doris は Hive 以外の外部テーブルのデータ変更を検知できません。外部テーブルのデータに不整合がある場合、マテリアライズドビューを使用すると一貫性のないデータが返される可能性があります。

**外部テーブルを含む透過的リライトのスイッチ**（デフォルトは `false`）: 透過的リライトに参加するマテリアライズドビューに外部テーブルを含めることを許可するかどうかを設定します。データの不整合を許容できる場合、またはスケジュールリフレッシュで一貫性を確保できる場合は、次のように有効にします。

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

**リライトが選択されない場合のトラブルシューティング**: マテリアライズドビューの状態が `MaterializedViewRewriteSuccessButNotChose` の場合、リライト自体は成功していますが、CBO がそのプランを選択していません。外部テーブルの統計情報が不完全なことが原因かもしれません。

ファイル一覧から行数を取得する機能を有効にします。

```sql
SET enable_get_row_count_from_file_list = true;
```

外部テーブルの統計情報を確認し、収集が完了しているか判断します。

```sql
SHOW TABLE STATS external_table_name;
```

:::

### 6.4 シナリオ 4: 書き込み効率の改善とリソース競合の軽減

**適用シナリオ**: システム性能の安定性と効率的なデータ処理が必要な、高スループットのデータ書き込みです。非同期マテリアライズドビューの柔軟なリフレッシュ戦略により、書き込み時の負荷を抑え、リソース競合を回避できます。

ベーステーブルのデータが変更されても、マテリアライズドビューのリフレッシュはすぐには起動しません。リフレッシュを遅らせることで、リソースへの負荷を抑え、書き込み処理との競合を回避できます。

**例**: 2 時間ごとにリフレッシュするスケジュール戦略です。`orders` と `lineitem` にデータをロードしても、マテリアライズドビューのリフレッシュはすぐには起動しません。

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 透過的リライトによるロード効率の改善

透過的リライトはクエリを高速化するだけでなく、ロード用の SQL も書き換え、ロード効率を改善できます。**バージョン 2.1.6** 以降、マテリアライズドビューとベーステーブルに強い一貫性がある場合、`INSERT INTO` や `INSERT OVERWRITE` などの DML 操作を透過的にリライトでき、データロード時の性能を大きく改善できます。

**ステップ 1**: `INSERT INTO` のデータを格納するターゲットテーブルを作成します。

```sql
CREATE TABLE IF NOT EXISTS target_table  (
orderdate      DATE NOT NULL,
shippriority   INTEGER NOT NULL,
linestatus     CHAR(1) NOT NULL,
sale           DECIMALV3(15,2) NOT NULL
)
DUPLICATE KEY(orderdate, shippriority)
DISTRIBUTED BY HASH(shippriority) BUCKETS 3;
```

**ステップ 2**: `common_schedule_join_mv` マテリアライズドビューを作成します。

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**ステップ 3**: リライト前のロード文です。

```sql
INSERT INTO target_table
SELECT
o_orderdate,
o_shippriority,
l_linestatus,
l_extendedprice * (1 - l_discount)
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**ステップ 4**: 透過的リライト後の等価な文です。

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

:::caution 注意

DML の対象が、データ変更を検知できない外部テーブルである場合、透過的リライトによってベーステーブルの最新データがターゲットテーブルへリアルタイムにロードされない可能性があります。データの不整合を許容できる場合、または自分で一貫性を確保できる場合は、次のスイッチを有効にできます。

DML では、マテリアライズドビューにデータ変更をリアルタイムに検知できない外部テーブルが含まれる場合に、構造に基づく透過的リライトを有効にするかどうかを設定できます（デフォルトでは無効）。

```sql
SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;
```

:::

---

## 7. 運用上の考慮事項 {#7-operational-considerations}

<!-- Knowledge type: operational recommendations -->

非同期マテリアライズドビューは本質的に拡張された ETL 計算であり、継続的な保守が必要です。日常の運用では次の三点が重要です。

1. **監視**: マテリアライズドビューの稼働開始後は、[メトリクス](../../../admin-manual/maint-monitor/metrics.md)を通じてシステムの状態を適時に監視してください。今後は非同期マテリアライズドビュー向けの監視メトリクスがさらに追加される予定です。現在は[タスク](../../../sql-manual/sql-functions/table-valued-functions/tasks.md)を使用して、タスク数、実行状態、所要時間などを確認できます。
2. **計画**: マテリアライズドビューの数、リフレッシュ頻度、クラスターの最大計算能力を計画してください。「マテリアライズドビューを作るだけで保守しない」ことは避けてください。マテリアライズドビューは本質的に拡張された ETL 計算であり、従来の ETL と同様に保守が必要です。
3. **リソース分離**: マテリアライズドビューはデータ計算タスクなので、必要に応じてリソースを分離してください。

---

## FAQ

**Q1: 非同期マテリアライズドビューでリアルタイムクエリを完全に置き換えられますか？**

いいえ。非同期マテリアライズドビューにはデータ遅延があり、その長さはトリガー方法、キューでの待機時間、リフレッシュ所要時間に依存します。IVM は頻繁な小規模バッチ変更の計算コストを抑えますが、リアルタイムの一貫性は提供しません。即時性の要件が高い場合は、同期マテリアライズドビューを検討してください。

**Q2: リアルタイムに近づけるために、すべてのマテリアライズドビューを高頻度のスケジュールリフレッシュに設定できますか？**

推奨しません。システムリソースを継続的に占有し、リフレッシュジョブ間でリソースが競合します。また、パーティション／タブレットの頻繁な追加と削除によって BE に大きな負荷がかかります。

**Q3: リフレッシュ戦略はどう選べばよいですか？**

まず計算の粒度を選び、次にトリガー方法を選びます。変更行数が影響を受けるパーティションに比べて非常に少ない場合は [IVM](incremental-materialized-view) を検討します。変更が少数のパーティションに集中する場合は、まず[パーティション化マテリアライズドビュー](#31-prefer-partitioned-materialized-views)を検討します。トリガー方法については、[三つのリフレッシュ戦略の比較](#32-comparison-of-the-three-refresh-strategies)と[リフレッシュ戦略の組み合わせに関する推奨事項](#34-recommendations-for-combining-refresh-strategies)を参照してください。

**Q4: マテリアライズドビューは構築後も保守が必要ですか？**

はい。マテリアライズドビューは本質的に拡張された ETL 計算であり、監視、計画、リソース分離が必要です。詳細は[運用上の考慮事項](#7-operational-considerations)を参照してください。

**Q5: ベーステーブルが頻繁に更新される場合でも、透過的リライトを利用できますか？**

ベーステーブルが頻繁に更新されると、マテリアライズドビューも頻繁に無効化され、透過的リライトには利用できなくなります（直接のクエリは可能です）。この状況で透過的リライトを利用するには、クエリ結果に一定の遅延を許容する必要があります。`grace_period` で設定できます。
