---
{
    "title": "非同期マテリアライズドビューのベストプラクティス",
    "language": "ja",
    "description": "非同期マテリアライズドビューはどのような場合に適しているか、更新戦略をどう選び、どう実装するかを説明します。適用シナリオの評価、利用原則、更新戦略の選択、実装方法、運用上の考慮事項を取り上げます。",
    "keywords": ["非同期マテリアライズドビュー", "利用上の推奨事項", "ベストプラクティス", "更新戦略", "パーティション化されたマテリアライズドビュー", "透過的な書き換え", "データの階層化モデリング", "Doris"]
}
---

<!-- Knowledge type: usage guide / best practices -->
<!-- Applicable scenarios: query acceleration, ETL data modeling, lakehouse federated query, write optimization -->

非同期マテリアライズドビューは、クエリ結果を事前計算して保存することでクエリを高速化します。ただし、更新のたびに計算とI/Oのコストがかかります。この記事では、**適用シナリオの評価、利用原則、更新戦略の選択、実装方法、運用上の考慮事項**を順に説明し、DBAと開発者が効率的な非同期マテリアライズドビューを構築できるようにします。

マテリアライズドビューの更新原則については、[更新原則](../overview.md)を参照してください。

## 判断のための簡易チェックリスト

非同期マテリアライズドビューを作成する前に、次の項目を確認してください。

- クエリに複数テーブルのJOIN、複雑な集約、またはウィンドウ関数が含まれていますか？
- ベーステーブルのデータ更新頻度は比較的低いですか（毎分複数回の更新は避けられますか）？
- 業務上、分単位以上のデータ遅延を許容できますか（1～5分以内のリアルタイムデータは不要ですか）？
- ベーステーブルのデータ量は十分に大きいですか（数百行よりはるかに多いですか）？
- よく使うクエリSQLのパターンを、グループ間で重複しないように分類できますか？
- ベーステーブルはパーティションテーブルで、パーティション化されたマテリアライズドビューを構築できますか？
- 定期更新に必要なリソースは十分にありますか？
- マテリアライズドビューの利用状況を定期的に確認し、未使用のものを適時削除できますか？

上記の大半に**はい**と答えられるなら、非同期マテリアライズドビューが適しています。

---

## 1. 適用シナリオの評価

<!-- Knowledge type: scenario assessment -->

次の表は、非同期マテリアライズドビューを**推奨する**典型的なシナリオと**推奨しない**シナリオをまとめたものです。

### シナリオ早見表

| 分類 | シナリオ | 主な特徴 | 推奨 |
|---|---|---|---|
| クエリの複雑さ | 複雑な集約クエリ | 複数テーブルのJOIN、SUM/AVG/COUNT、ウィンドウ関数 | はい |
| レポート | 一貫したスナップショットを使うレポート | 毎日午前零時など、決まった時点で生成 | はい |
| 計算負荷 | 計算負荷の高い分析 | 複雑な数式、データ変換、予測モデル | はい |
| データウェアハウスのモデリング | スター／スノーフレークスキーマ | ファクトテーブルと複数のディメンションテーブルのJOIN | はい |
| レイクハウス | レイクハウスの高速化 | ネットワークとオブジェクトストレージのスループットがデータレイクへのクエリを制限 | はい |
| データウェアハウスの階層化 | ETLによる階層化処理 | ベーステーブルに生データがあり、複数階層の処理が必要 | はい |
| データ更新 | 頻繁に更新されるベーステーブル | 毎分複数回更新 | いいえ |
| クエリの複雑さ | 単純なクエリ | 単一テーブルのスキャンまたは単純なフィルター | いいえ |
| 鮮度 | 準リアルタイム（1～5分以内）のデータ | 業務上、データが常に最新である必要がある | いいえ |
| データ規模 | 非常に小さいソーステーブル | 数百行程度 | いいえ |

### 推奨するシナリオ

#### 複雑な集約クエリ

- **説明**：複数テーブルのJOIN、複雑な集約関数（SUM、AVG、COUNTなど）、またはウィンドウ関数を使うクエリ。
- **利点**：実行のたびに複雑なロジックを再計算せずに済みます。

#### レポート

- **説明**：毎日午前零時などの決まった時点で生成した、一貫したスナップショットを必要とするレポート。
- **利点**：すべてのユーザーが同じ時点のデータを参照できます。

#### 計算負荷の高い分析

- **説明**：顧客生涯価値の計算や予測分析モデルなど、複雑な数式やデータ変換を伴う分析クエリ。
- **利点**：結果を事前計算し、実行時のリソース消費を減らします。

#### データウェアハウスのスター／スノーフレークスキーマ

- **説明**：売上ファクトテーブルと商品、時間、地域のディメンションテーブルをJOINする場合など、ファクトテーブルが複数のディメンションテーブルと結合されるシナリオ。
- **利点**：JOINの結果を事前に実体化して分析クエリを高速化します。

#### レイクハウスの高速化

- **説明**：データレイクへのクエリは、ネットワーク遅延やオブジェクトストレージのスループット制限によって遅くなる場合があります。
- **利点**：Dorisのローカルストレージによる高速化を利用して、データレイク分析を高速化します。

#### データウェアハウスの階層化

- **説明**：ベーステーブルに大量の生データがあり、クエリに複雑なETL処理が必要な場合。
- **利点**：データの上に複数階層の非同期マテリアライズドビューを構築し、データウェアハウスを階層化します。

### 推奨しないシナリオ

#### 頻繁に更新されるベーステーブル

- **説明**：ソーステーブルのデータが非常に頻繁に変わる場合（毎分複数回など）。
- **問題点**：非同期マテリアライズドビューの同期維持が難しく、更新コストも高くなります。代わりに定期更新を検討してください。

#### 単純なクエリ

- **説明**：単一テーブルのスキャンまたは単純なフィルタリングのみを行うクエリ。
- **問題点**：非同期マテリアライズドビューによる利点が更新コストに見合いません。

#### リアルタイムデータ（1～5分以内）が必要なシナリオ

- **説明**：業務上、データが常に最新である必要があります。
- **問題点**：非同期マテリアライズドビューにはデータ遅延があります。

#### 非常に小さいソーステーブル

- **説明**：ベーステーブルのレコードが数百行程度しかない場合。
- **問題点**：非同期マテリアライズドビューによる最適化の効果は大きくありません。

---

## 2. 利用原則

<!-- Knowledge type: principles and constraints -->

### 2.1 非同期マテリアライズドビューを使う場面

| 観点 | 説明 |
| --- | --- |
| 鮮度 | データの鮮度要件が高くないシナリオ（T+1データなど）に適しています。鮮度要件が高い場合は、同期マテリアライズドビューを使用します。 |
| 高速化と一貫性 | よく使うクエリSQLのパターンを、グループ間の重複ができるだけ少なくなるよう分類します。分類が明確なほど、構築の品質が高まります。 |
| 再利用性 | 一つのクエリで複数のマテリアライズドビューを利用でき、一つのマテリアライズドビューを複数のクエリで利用できます。 |
| トレードオフ | マテリアライズドビューにヒットしたときの応答時間（高速化）、構築コスト、データの一貫性要件を総合的に検討します。 |

### 2.2 マテリアライズドビューの定義と構築コストのトレードオフ

- **元のクエリに近い定義**：高速化の効果は高いものの、汎用性と再利用性が低く、構築コストが高くなります。
- **より汎用的な定義**（WHERE条件を設けない、集約のディメンションを増やすなど）：高速化の効果は低くなるものの、汎用性と再利用性が高く、構築コストは低くなります。

:::caution 注意

- **マテリアライズドビューの数を制御する**：数が多ければよいわけではありません。構築と更新にリソースを消費し、透過的な書き換え時にCBOが最適なビューを選ぶ時間も必要です。理論上、ビューが多いほど透過的な書き換えに時間がかかります。
- **利用状況を定期的に確認する**：未使用のマテリアライズドビューは適時削除してください。
- **ベーステーブルの更新頻度**：ベーステーブルを頻繁に更新すると、マテリアライズドビューが頻繁に無効化され、透過的な書き換えに利用できなくなります（直接クエリすることは可能です）。この場合に透過的な書き換えを使うには、クエリ結果にある程度の遅延を許容する必要があります。許容する遅延は`grace_period`で設定できます。詳細は`grace_period`の説明を参照してください。

:::

---

## 3. 更新戦略の選択

<!-- Knowledge type: decision guide -->

非同期マテリアライズドビューには、主に**手動更新**、**スケジュール更新**、**トリガーベースの更新**の三つの戦略があります。適切な戦略を選ぶことは、データの鮮度とシステム性能のバランスを取るうえで重要です。

### 3.1 パーティション化されたマテリアライズドビューを優先する {#31-prefer-partitioned-materialized-views}

次の条件をすべて満たす場合は、パーティション化されたマテリアライズドビューの構築を推奨します。

1. マテリアライズドビューのベーステーブルが大量のデータを持つパーティションテーブルである。
2. マテリアライズドビューが参照する非パーティションテーブルは、頻繁には変更されない。
3. マテリアライズドビューの定義SQLとパーティションフィールドがパーティション導出要件（パーティションの増分更新要件）を満たす。詳細は[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)を参照してください。
4. マテリアライズドビューのパーティション数が多すぎない。パーティションが多すぎると構築に過度の時間がかかります。

> マテリアライズドビューの一部のパーティションが無効になっても、透過的な書き換えでは有効なパーティションとベーステーブルをUNION ALLで結合して結果を返せます。

パーティション化されたマテリアライズドビューを構築できない場合は、**全量更新**するマテリアライズドビューを検討してください。

### 3.2 三つの更新戦略の比較 {#32-comparison-of-the-three-refresh-strategies}

| 更新戦略 | トリガー方法 | データの鮮度 | 自動化の程度 | 主なリスク |
|---|---|---|---|---|
| 手動更新 | 明示的なユーザーコマンドまたは外部スケジューリング | 低い（スケジュール次第） | 低い | スケジュールの管理が必要 |
| スケジュール更新 | 一定の時間間隔（最小単位は分） | 中程度（遅延が予測可能） | 中程度 | 頻繁に実行するとリソースを継続的に占有 |
| トリガーベースの更新 | ベーステーブルのデータが変更されると自動的に実行 | 高い | 高い | 更新が集中する可能性 |

### 3.3 各更新戦略の詳細

#### 手動更新

- **動作**：ユーザーが明示的なコマンドを実行するか、外部システムでスケジューリングして更新を開始します。
- **適用シナリオ**：
    - リアルタイム性の要件が低いレポートシステム
    - データウェアハウスでの履歴データ分析
    - 特定の業務プロセスに合わせて更新する必要があるシナリオ
    - システムリソースの調整が必要な大規模データ更新
- **利点**：更新時刻を完全に制御でき、業務のピーク時間帯を避けられます。
- **欠点**：追加の更新スケジュール管理と、外部から更新が繰り返し実行されるのを防ぐための十分な耐障害性が必要です。

#### スケジュール更新

- **動作**：
    - 一定の時間間隔で自動更新する
    - 最小の時間単位は分
    - 最初のタスク実行開始時刻を指定できる
- **適用シナリオ**：
    - 業務指標の定期的な監視
    - 階層化されたデータパイプライン
    - 時間的な要件が階層ごとに異なるレポートシステム
    - 定期的に変動するソースデータ
- **利点**：決まったスケジュールでデータを処理でき、データ遅延を予測できます。
- **欠点**：データの鮮度には限界があり、関連するビューの更新順序を手動で調整する必要があります。
- **設定上の制約**：リアルタイムに近づけるため、すべてのマテリアライズドビューを高頻度のスケジュール更新に設定することは推奨しません。次の問題が生じるためです。
    - システムリソースを継続的に占有する
    - 更新ジョブ間でリソースが競合する
    - パーティションやタブレットの追加と削除が頻繁に発生し、BEに大きな負荷がかかる

#### トリガーベースの更新

- **動作**：ベーステーブルのデータが変更されると自動的に更新を開始します。
- **適用シナリオ**：
    - 複数階層のマテリアライズドビュー構成における上位階層のビュー
    - ベーステーブルの変更頻度が低いシナリオ
- **利点**：データの鮮度と自動化の程度が高くなります。
- **欠点**：更新が集中する可能性があり、システム負荷を予測しにくくなります。
- **設定上の制約**：次の条件を満たさない限り、最下位階層のマテリアライズドビューにトリガーベースの更新を設定することは推奨しません。
    - ベーステーブルの更新頻度が低いことを確認できる（例えば数十分に一回の変更）

### 3.4 更新戦略の組み合わせに関する推奨事項 {#34-recommendations-for-combining-refresh-strategies}

#### データウェアハウスの階層別

| ビューの階層 | 推奨する更新戦略 |
|---|---|
| 最下位階層 | スケジュール更新（毎時など） |
| 中間階層 | スケジュール更新またはトリガーベースの更新 |
| 表示階層 | トリガーベースの更新または手動更新 |

#### 業務上の重要度別

| 業務レベル | 推奨戦略 |
|---|---|
| 重要なリアルタイム業務データ | 非同期マテリアライズドビューは推奨しない |
| 通常の分析データ | スケジュール更新（毎日／毎時） |
| 履歴／アーカイブデータ | 手動更新 |

#### データ変更頻度別

| 変更頻度 | 推奨戦略 |
|---|---|
| 高頻度の変更 | スケジュール更新（間隔を長めにする）または手動更新 |
| 低頻度の変更 | トリガーベースの更新または短い間隔でのスケジュール更新 |
| バッチ変更 | 変更後に手動更新 |

### 3.5 更新頻度に関する推奨事項

以下は一般的な推奨事項です。実際の選択では、システムリソース、非同期マテリアライズドビューの数、その他の業務によるリソース使用量も評価してください。

| 実際の更新所要時間 | 推奨する更新間隔 |
|---|---|
| 15秒未満 | 5分以上 |
| 10分未満 | 1時間以上 |
| 1時間未満 | 1日以上 |

---

## 4. パーティション化されたマテリアライズドビューの実践

<!-- Applicable scenarios: large partitioned base tables -->

### 4.1 パーティションの対応関係

マテリアライズドビューのパーティションは、ベーステーブルのパーティションからマッピングして作成されます。通常は1:1または1:nの関係になります。パーティション導出の詳細な要件については、[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)および[非同期マテリアライズドビューのFAQ Q12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-a-partition-materialized-view)を参照してください。

### 4.2 パーティションの無効化と更新の動作

| トリガー | 影響 | 対応 |
| --- | --- | --- |
| ベーステーブルのパーティションデータが変更される（挿入、削除など） | 対応するマテリアライズドビューのパーティションが無効になります。無効なパーティションは透過的な書き換えには使用できませんが、直接クエリすることは可能です。透過的な書き換えでは、無効なパーティションに該当する部分をベーステーブルと合わせて処理します | `SHOW PARTITIONS FROM mv_name`でパーティションの状態を確認します |
| 参照先の非パーティションテーブルのデータが変更される | マテリアライズドビューのすべてのパーティションが無効になり、透過的な書き換えには使用できなくなります | `REFRESH MATERIALIZED VIEW mv1 AUTO;`を実行し、データが変更されたすべてのパーティションを更新します |
| 参照先の非パーティションテーブルでは挿入のみを行い、既存データを変更しない | デフォルトではすべてのパーティションが無効になります | 作成時に`excluded_trigger_tables = 'non_partitioned_table_name1,non_partitioned_table_name2'`を指定します。次の更新では、パーティションテーブルに対応する無効なパーティションのみが更新されます |

> **設計上の推奨事項**：頻繁に変更されるデータを持つテーブルは、パーティション化されたマテリアライズドビューが参照するパーティションテーブルに配置し、変更頻度の低いディメンションテーブルは参照対象の非パーティションテーブルとして配置します。

### 4.3 パーティション単位の透過的な書き換え

パーティション化されたマテリアライズドビューの透過的な書き換えは、**パーティション単位**で動作します。

- マテリアライズドビューの一部のパーティションが無効でも、透過的な書き換えに利用できます。
- ただし、クエリが一つのパーティションのみを対象とし、そのパーティションが無効な場合、その透過的な書き換えにはマテリアライズドビューを利用できません。

### 4.4 完全な例

**目的**：日単位のパーティションを持つマテリアライズドビューを構築し、日別の集約クエリを高速化します。

**手順1**：日単位でパーティション化されたベーステーブル`lineitem`を作成し、ディメンションテーブル`partsupp`を用意します。

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

**手順2**：日別に集約する典型的なクエリです。

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

**手順3**：ベーステーブルと同じ日単位のパーティションを持ち、日別にデータを集約するマテリアライズドビューを構築します。

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
この機能はApache Doris 2.1.1以降でサポートされています。
:::

マテリアライズドビューでは、直近の数パーティションのデータだけを保持し、更新のたびに期限切れのパーティションデータを自動削除できます。以下のプロパティで設定します。

| プロパティ | 説明 |
| --- | --- |
| `partition_sync_limit` | ベーステーブルのパーティションフィールドが時間型の場合、ベーステーブルから同期するパーティションの範囲を設定します（`partition_sync_time_unit`と併用）。例えば、値を`3`、単位を`DAY`にすると、直近3日分のパーティションとデータのみがベーステーブルから同期されます |
| `partition_sync_time_unit` | パーティション更新の時間単位。`DAY`／`MONTH`／`YEAR`をサポートし、デフォルトは`DAY`です |
| `partition_date_format` | ベーステーブルのパーティションフィールドが文字列の場合、`partition_sync_limit`の機能を使うために必要な日付形式です |

以下のマテリアライズドビューは直近3日分のデータのみを保持します。直近3日間にデータがなければ、マテリアライズドビューを直接クエリしてもデータは返されません。

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

### 5.1 基本的な進め方

マテリアライズドビューを使ってクエリを高速化するには、次の手順に従います。

1. プロファイルファイルを確認し、クエリで最も時間がかかる処理を特定します。通常、ボトルネックはJoin、Aggregate、Filter、Calculated Expressionsのいずれかです。
2. ボトルネックとなる演算子に対応したマテリアライズドビューを構築します。例えば、Joinが多くの計算リソースを消費し、Aggregateの消費が比較的少ない場合は、Joinを対象にしたマテリアライズドビューを構築します。

### 5.2 四種類の演算に対する構築上の推奨事項

#### 5.2.1 Joinの場合

- クエリで共通して使われるテーブル結合パターンを抽出し、マテリアライズドビューを構築します。ビューがヒットするとJoinの計算を省けます。
- より汎用的なJoinマテリアライズドビューを得るため、**クエリのフィルターを取り除きます**。

#### 5.2.2 Aggregateの場合

- 集約後のデータ量を抑えるため、**カーディナリティの低いフィールド**をマテリアライズドビューのディメンションに使います。
- マテリアライズドビューの集約粒度はクエリより細かくします（つまり、ビューの集約ディメンションにクエリの集約ディメンションを含めます）。ビューの集約関数にもクエリで使用する集約関数を含める必要があります。

**カーディナリティ評価の例**：

- テーブル`t1`には1,000,000行があり、クエリに`GROUP BY a, b, c`が含まれます。
    - a、b、cのカーディナリティがそれぞれ100、50、15の場合、集約結果は約75,000行です。**マテリアライズドビューは有効です**。
    - a、b、cに相関がある場合、集約後のデータ量はさらに減ります。
    - cのカーディナリティが3,500の場合、集約結果は約17,000,000行となり、元のテーブルより大きくなります。**マテリアライズドビューは適しません**。

#### 5.2.3 Filterの場合

- クエリが頻繁に同じフィールドでフィルタリングするなら、マテリアライズドビューに対応するフィルターを追加してデータ量を減らします。
- **マテリアライズドビューのフィルターはクエリのフィルターより緩く**し、クエリのフィルターがビューのフィルターを含意するようにします。

例えば、クエリが`a > 10 AND b > 5`の場合：

- マテリアライズドビューにはフィルターを設定しないか、
- `a > 5 AND b > 5`または`a > 5`のような、より範囲の広いフィルターを設定します。

#### 5.2.4 計算式の場合

- `CASE WHEN`や文字列処理など、コストの高い式を事前計算すると、クエリ性能を大幅に改善できます。
- 単一のマテリアライズドビューに含める列を増やしすぎないでください。クエリSQLのパターンごとに分類し、グループごとに個別のビューを構築します。

**集約クエリ高速化の完全な例**：

クエリ1：

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

クエリ2：

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

上記のクエリに対しては、より汎用的な集約マテリアライズドビューを構築します。`l_partkey`と`l_suppkey`の両方を集約ディメンションに含め、`o_orderdate`をフィルター条件として使います。注意：`o_orderdate`はマテリアライズドビューの条件補償に使うだけでなく、集約ディメンションにも含める必要があります。これにより、クエリ1とクエリ2の両方がマテリアライズドビューにヒットできます。

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

## 6. 典型的なユースケース

<!-- Knowledge type: scenario examples -->

### 6.1 シナリオ1：クエリの高速化

**適用シナリオ**：BIレポートなど、クエリの応答時間に敏感で、数秒以内の結果を求めるシナリオ。複数テーブルのJoinとその後の集約は多くの計算リソースを消費するため、応答時間の要件を満たしにくくなります。非同期マテリアライズドビューは直接クエリと透過的な書き換えの両方に対応します。オプティマイザーは、書き換えアルゴリズムとコストモデルに基づいて最適なマテリアライズドビューを自動的に選択します。

#### ユースケース1：複数テーブルのJoin集約クエリの高速化

より汎用的なマテリアライズドビューを構築し、複数テーブルのJoin集約クエリを高速化します。

**目的**：次の三つのクエリすべてに対応する単一のマテリアライズドビューを構築します。

クエリ1：

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

クエリ2：

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

クエリ3：

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

**構築案1**：汎用的なJoinマテリアライズドビュー。クエリ1とクエリ2のフィルター条件を取り除き、`l_extendedprice * (1 - l_discount)`を事前計算します。

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

**構築案2**：上記のマテリアライズドビューではクエリ2の高速化要件を満たせない場合、集約マテリアライズドビューを追加で構築します。汎用性を保つため、`o_orderdate`のフィルターを取り除きます。

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

#### ユースケース2：ログクエリの高速化

**適用シナリオ**：ベーステーブルは通常、時間単位でパーティション化され、クエリは主に時刻と識別子フラグでフィルタリングする単一テーブルの集約です。応答速度が十分でない場合は、**非同期マテリアライズドビューと同期マテリアライズドビューを併用できます**。

**手順1**：ベーステーブルを定義します。

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

**手順2**：分単位で集約したマテリアライズドビューを構築し、一定の集約効果を得ます。

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

**手順3**：典型的なクエリを実行します。

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

### 6.2 シナリオ2：データモデリング（ETL）

**適用シナリオ**：データ分析では複数のテーブルを結合・集約することが多く、複雑で繰り返し実行されるクエリは、遅延とリソース消費を増やします。非同期マテリアライズドビューを使って階層化されたデータモデルを構築します。既存のマテリアライズドビューの上に、さらに上位のマテリアライズドビューを構築できます（2.1.3以降でサポート）。

**階層ごとのトリガー方法の選択**：

- 第一階層をスケジュール更新し、第二階層をトリガー更新する：第一階層の更新が完了すると、第二階層の更新が自動的に開始されます。
- すべての階層をスケジュール更新する：第二階層の更新時には、第一階層がベーステーブルと同期しているかは考慮されず、第一階層のデータだけが処理されて第二階層に同期されます。

次の例ではTPC-Hデータセットを使用し、地域と国ごとの月別注文数と利益を分析します。

**元のクエリ（マテリアライズドビューなし）**：

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

**手順1**：DWD階層（明細データ）の注文詳細ワイドテーブルを構築します。

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

**手順2**：DWS階層（集計データ）の日別注文集計を構築します。

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

**手順3**：マテリアライズドビューを使ってクエリを最適化します。

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) AS revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```

### 6.3 シナリオ3：レイクハウスのフェデレーテッドデータクエリ

**適用シナリオ**：現代のデータアーキテクチャでは、ストレージコストとクエリ性能のバランスを取るために、レイクハウス設計がよく採用されます。このアーキテクチャには主に次の二つの課題があります。

- **クエリ性能の制限**：データレイクへの頻繁なクエリは、ネットワーク遅延やサードパーティーのサービスの影響を受け、実行が遅くなります。
- **データの階層化モデリングの複雑さ**：データレイクからリアルタイムデータウェアハウスへのデータ移動や変換には通常、複雑なETLが必要で、保守コストが高くなります。

**Dorisの非同期マテリアライズドビューによる解決方法**：

- **透過的な書き換えによるクエリの高速化**：よく使われるデータレイククエリの結果をDorisの内部ストレージに実体化し、透過的な書き換えでクエリ性能を改善します。
- **階層化モデリングの簡素化**：データレイク内のテーブルの上にマテリアライズドビューを作成できるため、データレイクからリアルタイムデータウェアハウスへの移行が容易になります。

以下ではHiveを例に説明します。

**手順1**：Hiveを基にCatalogを作成します（TPC-Hデータセットを使用）。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

**手順2**：Hive Catalogを基にマテリアライズドビューを作成します。

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

**手順3**：クエリを実行し、マテリアライズドビューを使った透過的な書き換えによって自動的に高速化します。

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

現在、DorisはHive以外の外部テーブルにおけるデータ変更を検出できません。外部テーブルのデータに不整合がある場合、マテリアライズドビューを使うと一貫性のないデータが返される可能性があります。

**外部テーブルを含む透過的な書き換えのスイッチ**（デフォルトは`false`）：透過的な書き換えに参加するマテリアライズドビューに外部テーブルを含められるかどうかを設定します。データの不整合を許容できる場合、またはスケジュール更新で一貫性を確保できる場合は、有効にしてください。

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

**書き換えが選択されない場合のトラブルシューティング**：マテリアライズドビューが`MaterializedViewRewriteSuccessButNotChose`状態の場合、書き換えには成功していますが、CBOがそのプランを選択していません。外部テーブルの統計情報が不完全なことが原因かもしれません。

ファイルから行数を取得する機能を有効にします。

```sql
SET enable_get_row_count_from_file_list = true;
```

外部テーブルの統計情報を確認し、完全に収集されているかを調べます。

```sql
SHOW TABLE STATS external_table_name;
```

:::

### 6.4 シナリオ4：書き込み効率の向上とリソース競合の軽減

**適用シナリオ**：システム性能の安定性と効率的なデータ処理が求められる、高スループットのデータ書き込みシナリオ。非同期マテリアライズドビューの柔軟な更新戦略により、書き込み時の負荷を抑え、リソース競合を避けられます。

ベーステーブルのデータが変更されても、マテリアライズドビューの更新はすぐには開始されません。更新を遅らせることで、リソースへの負荷を軽減し、書き込み処理との競合を避けられます。

**例**：2時間ごとに更新するスケジュール更新戦略。`orders`と`lineitem`にデータをロードしても、マテリアライズドビューの更新はすぐには開始されません。

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

#### 透過的な書き換えによるロード効率の向上

透過的な書き換えは、クエリだけでなくロード用SQLも書き換え、ロード効率を向上させます。**バージョン2.1.6**以降、マテリアライズドビューとベーステーブルの一貫性が強く保証されている場合、`INSERT INTO`や`INSERT OVERWRITE`などのDML操作を透過的に書き換えられ、データロードの性能が大幅に向上します。

**手順1**：`INSERT INTO`データのロード先テーブルを作成します。

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

**手順2**：マテリアライズドビュー`common_schedule_join_mv`を作成します。

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

**手順3**：書き換え前のロード文を示します。

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

**手順4**：透過的な書き換え後の等価な文を示します。

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

:::caution 注意

DMLの対象が、データ変更を検出できない外部テーブルの場合、透過的な書き換えによってベーステーブルの最新データがロード先テーブルにリアルタイムで取り込まれない可能性があります。データの不整合を許容できる場合、または一貫性を自分で確保できる場合は、次のスイッチを有効にできます。

DMLで、マテリアライズドビューにリアルタイムのデータ変更を検出できない外部テーブルが含まれる場合、マテリアライズドビューの構造に基づく透過的な書き換えを有効にするかどうかを設定します（デフォルトでは無効）。

```sql
SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;
```

:::

---

## 7. 運用上の考慮事項 {#7-operational-considerations}

<!-- Knowledge type: operational recommendations -->

非同期マテリアライズドビューは本質的に高度なETL計算であり、継続的な保守が必要です。日常的な運用では、次の三点が重要です。

1. **監視**：マテリアライズドビューの稼働後は、[メトリクス](../../../admin-manual/maint-monitor/metrics.md)を使ってシステム状態を適時監視します。非同期マテリアライズドビューでは、今後さらに多くの監視メトリクスが公開される予定です。現在は[タスク](../../../sql-manual/sql-functions/table-valued-functions/tasks.md)を使い、タスク数、実行状態、実行時間などを確認できます。
2. **計画**：マテリアライズドビューの数、更新頻度、クラスターの最大計算能力を計画します。「構築するだけで保守しない」状態は避けてください。マテリアライズドビューは本質的に高度なETL計算であり、従来のETLと同様に保守が必要です。
3. **リソース分離**：マテリアライズドビューはデータ計算タスクなので、必要に応じてリソース分離を適用します。

---

## FAQ

**Q1：非同期マテリアライズドビューはリアルタイムクエリを完全に置き換えられますか？**

いいえ。非同期マテリアライズドビューには、更新戦略に応じたデータ遅延があり、1～5分以内の鮮度が必要なシナリオには適しません。鮮度要件が高い場合は、同期マテリアライズドビューを検討してください。

**Q2：すべてのマテリアライズドビューを高頻度のスケジュール更新に設定して、リアルタイムに近づけられますか？**

推奨しません。システムリソースを継続的に占有し、更新ジョブ同士のリソース競合や、パーティション／タブレットの頻繁な追加と削除が発生し、BEに大きな負荷がかかります。

**Q3：更新戦略はどのように選べばよいですか？**

[三つの更新戦略の比較](#32-comparison-of-the-three-refresh-strategies)と[更新戦略の組み合わせに関する推奨事項](#34-recommendations-for-combining-refresh-strategies)を参照し、データウェアハウスの階層、業務上の重要度、データ変更頻度に応じて選んでください。まず、[パーティション化されたマテリアライズドビュー](#31-prefer-partitioned-materialized-views)を構築できるか評価します。

**Q4：マテリアライズドビューは構築後も保守が必要ですか？**

はい。マテリアライズドビューは本質的に高度なETL計算であり、監視、計画、リソース分離が必要です。詳細は[運用上の考慮事項](#7-operational-considerations)を参照してください。

**Q5：ベーステーブルが頻繁に更新されても、透過的な書き換えを使えますか？**

ベーステーブルを頻繁に更新すると、マテリアライズドビューが頻繁に無効化され、透過的な書き換えに利用できなくなります（直接クエリすることは可能です）。この場合に透過的な書き換えを使うには、クエリ結果にある程度の遅延を許容する必要があります。許容する遅延は`grace_period`で設定できます。
