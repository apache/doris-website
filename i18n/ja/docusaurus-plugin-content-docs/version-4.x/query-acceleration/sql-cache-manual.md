---
{
    "title": "SQL Cache クエリキャッシュガイド",
    "sidebar_label": "SQL Cache",
    "language": "ja",
    "description": "Doris で SQL Cache を有効にする方法と、キャッシュミスや無効化を調査する方法を説明します。仕組み、設定、監視、トラブルシューティングを扱います。",
    "keywords": ["Doris SQL Cache", "クエリキャッシュ", "クエリ高速化", "キャッシュヒット", "キャッシュの無効化", "enable_sql_cache", "T+1 クエリの最適化"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: users who want to accelerate repeated queries by caching query results -->

SQL Cache は、Doris が提供するクエリ結果のキャッシュ機構です。SQL テキストやデータのバージョンなどのメタデータをキーとしてクエリ結果をキャッシュし、以後の同一クエリにキャッシュから直接結果を返します。これにより、計算を繰り返す際の負荷を大幅に削減できます。

## 読む前のチェックリスト

このガイドを読む前に、次の点を理解しているか、必要な準備ができているか確認してください。

- 自分のクエリがキャッシュに適しているか（T+1 のオフライン分析や更新頻度の低いデータなど）
- 使用中の Doris のバージョンで `explain plan` による SQL Cache の確認がサポートされているか（2.1.3+ を推奨）
- SQL Cache がサポートするのは OlapTable の内部テーブルと Hive の外部テーブルだけであること
- 非決定的関数（`now()` や `random()` など）がキャッシュヒット率に影響すること
- FE/BE の設定を変更する権限があるか（メモリ制御とグローバルスイッチに使用）

SQL Cache の有効化を決める前に、クエリが次の条件を満たしているか一つずつ確認してください。

- SQL 文が高頻度で**繰り返し実行**される
- データの**更新頻度が低い**（キャッシュヒット率が高い）
- クエリに `random()` などの乱数関数が**含まれていない**
- 各クエリで**指標フィールドが一致している**（動的な追加や削除がない）

## 1. 概念

<!-- Knowledge type: concept -->
<!-- Applicable scenario: first-time understanding of how SQL Cache works -->

SQL Cache は、**データの更新頻度が低い**クエリに適しています。クエリ結果をキャッシュすることで、計算の繰り返しを避けます。

### キャッシュヒットを決める主な要素

SQL Cache は、次の要素の組み合わせによってキャッシュデータを一意に識別します。

| 主な要素 | 説明 |
| --- | --- |
| SQL テキスト | 完全に一致する SQL 文字列 |
| ビュー定義 | 関連するビューの DDL 定義 |
| テーブルとパーティションのバージョン | データが変更されたかどうか |
| ユーザー変数とその値 | SQL 内で参照される変数の現在の値 |
| 非決定的関数とその結果 | `now()` や `random()` などの関数の計算結果 |
| 行ポリシーの定義 | Row Policy の設定 |
| データマスキングの定義 | Data Masking の設定 |

> いずれかの要素が変わると（SQL の書き換え、クエリのフィールドや条件の変更、データ更新によるバージョン変更など）、キャッシュはヒットしません。複数テーブルの Join クエリでは、**いずれかのテーブル**が更新されるとパーティション ID またはバージョン番号が変わり、キャッシュはヒットしなくなります。

### 適用シナリオ

- **強く推奨**: T+1 の更新シナリオ。データは夜間に更新されます。最初のクエリは BE から結果を取得してキャッシュに書き込み、以後の同一クエリにはキャッシュから直接結果を返します。
- **選択可能**: リアルタイムで更新されるデータ。SQL Cache を有効にすることはできますが、ヒット率は低くなります。
- **サポート範囲**: 現在は OlapTable の内部テーブルと Hive の外部テーブルをサポートしています。

## 2. 制限事項

<!-- Knowledge type: limitation -->
<!-- Applicable scenario: optimizing the cache hit rate when writing SQL -->

### 非決定的関数の影響

**定義**: 非決定的関数とは、結果が入力パラメータと一定の関係を持たない関数です。

| 関数 | 動作 | キャッシュを利用できるか |
| --- | --- | --- |
| `now()` | 現在時刻を秒単位で返し、毎秒変わる | 同じ秒内なら再利用可能 |
| `date(now())` | 秒単位の時刻を日単位に変換する | 同じ日内なら再利用可能（推奨） |
| `random()` | 呼び出すたびに異なる結果を返す | キャッシュはほぼヒットしない |

**最適化のヒント**: 細かい時間粒度を粗い時間粒度に変換します。たとえば、`select * from tbl where dt = date(now())` を `select * from tbl where dt = now()` の代わりに使うと、同じ日内のすべてのクエリでキャッシュをヒットさせることができます。`random()` のように非決定性の強い関数はクエリで使用しないでください。

### 指標フィールドの追加による影響

SQL Cache は、クエリで指定したフィールドに厳密に対応する結果をキャッシュします。「少ない指標」のキャッシュで「多い指標」のクエリを満たすことは**できません**。

| シナリオ | 動作 | 影響 |
| --- | --- | --- |
| 2 つの指標の結果がキャッシュされており、新しいクエリが 3 つの指標を要求する | キャッシュを再利用できず、クエリの再実行が必要になる | ヒット率が低下し、新しい結果が別のキャッシュエントリに書き込まれる |

**最適化のヒント**: 業務レポートやクエリテンプレートの指標フィールドを固定してください。指標を追加する必要がある場合は、その場で追加するのではなくクエリテンプレートを変更し、キャッシュが使えなくなるのを防ぎます。

## 3. 実装の仕組み

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding cache hit behavior and locating anomalies -->

### FE 側の実装

FE がクエリリクエストを受け取った後の処理フローは次のとおりです。

1. **メタデータの検索**: SQL 文字列をキーとしてメモリ内のメタデータを検索します（メタデータにはテーブルとパーティションのバージョンが含まれます）。
2. **バージョンの比較**: メタデータに変更がなければ、データは変更されておらず、キャッシュを再利用できます。
3. **解析の省略**: SQL の解析と最適化の処理を省略し、コンシステントハッシュに基づいて該当する BE を特定します。
4. **結果の返却**:
    - BE でキャッシュがヒットした場合: 結果をクライアントに直接返します。
    - キャッシュがミスした場合: SQL の解析、最適化、計算の処理をすべて実行します。
5. **結果の書き戻し**: BE での計算が終わると、FE は結果を該当する BE に保存し、メタデータを自身のメモリに記録して次のクエリで再利用します。

> 特別な最適化: SQL の最適化段階で結果が 0 行または 1 行だけと判定された場合、FE は結果を自身のメモリに直接保存し、以後の同一クエリを高速化します。

### BE 側の実装

- 結果を保存する BE は**コンシステントハッシュ**で選択されます。結果は BE のメモリ内に **HashMap** 構造で保存されます。
- キャッシュの読み書きには、SQL 文字列などのメタデータから生成したダイジェストをキーとして使用し、結果データをすばやく取得します。

## 4. クイックスタート

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: enabling SQL Cache and verifying cache hits -->

### ステップ 1: SQL Cache を有効化または無効化する

**目的**: セッションまたはグローバルレベルで SQL Cache を有効にします（デフォルトでは無効）。

```sql
-- Turn on SQL Cache in the current session; it is off by default
set enable_sql_cache=true;
-- Turn off SQL Cache in the current session
set enable_sql_cache=false;

-- Turn on SQL Cache globally; it is off by default
set global enable_sql_cache=true;
-- Turn off SQL Cache globally
set global enable_sql_cache=false;
```

**注意事項**: セッションレベルの設定は現在のセッションにのみ適用されます。グローバル設定は、新しく作成されるすべてのセッションに適用されます。

### ステップ 2: クエリが SQL Cache にヒットしたか確認する

#### 方法 A: `explain plan` を使用する（Doris 2.1.3+ に適用）

**目的**: クエリプランを使ってキャッシュヒットを判定します。
**コマンド**: `explain plan <your SQL>` を実行します。
**注意事項**: クエリプランのツリーに `LogicalSqlCache` または `PhysicalSqlCache` ノードが表示されれば、そのクエリは SQL Cache にヒットしています。

```sql
> explain plan select * from t2;

+------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                            |
+------------------------------------------------------------------------------------------------------------+
| ========== PARSED PLAN (time: 28ms) ==========                                                             |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== ANALYZED PLAN  ==========                                                                       |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== REWRITTEN PLAN  ==========                                                                      |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== OPTIMIZED PLAN  ==========                                                                      |
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
+------------------------------------------------------------------------------------------------------------+
```

#### 方法 B: Profile を確認する（Doris 2.1.3 より前のバージョン）

**目的**: `explain plan` がサポートされていないバージョンでキャッシュヒットを確認します。
**コマンド**: Profile を有効にして Execution Summary を確認します。
**注意事項**: `Is Cached:` フィールドに `Yes` と表示されていれば、クエリは SQL Cache にヒットしています。

```sql
Execution  Summary:
      -  Parse  SQL  Time:  18ms
      -  Nereids  Analysis  Time:  N/A
      -  Nereids  Rewrite  Time:  N/A
      -  Nereids  Optimize  Time:  N/A
      -  Nereids  Translate  Time:  N/A
      -  Workload  Group:  normal
      -  Analysis  Time:  N/A
      -  Wait  and  Fetch  Result  Time:  N/A
      -  Fetch  Result  Time:  0ms
      -  Write  Result  Time:  0ms
      -  Doris  Version:  915138e801
      -  Is  Nereids:  Yes
      -  Is  Cached:  Yes
      -  Total  Instances  Num:  0
      -  Instances  Num  Per  BE:  
      -  Parallel  Fragment  Exec  Instance  Num:  1
      -  Trace  ID:  
      -  Transaction  Commit  Time:  N/A
      -  Nereids  Distribute  Time:  N/A
```

## 5. メトリクスの監視

<!-- Knowledge type: observability -->
<!-- Applicable scenario: monitoring cache usage and evaluating optimization effects -->

### FE の監視メトリクス

**エンドポイント**: `http://${FE_IP}:${FE_HTTP_PORT}/metrics`
**注意事項**: メトリクスの値は**単調増加**します。FE を再起動すると、カウントは 0 から始まります。

```Plain
# 1 SQL has been written to the cache
doris_fe_cache_added{type="sql"} 1

# The SQL Cache has been hit 2 times
doris_fe_cache_hit{type="sql"} 2
```

### BE の監視メトリクス

**エンドポイント**: `http://${BE_IP}:${BE_HTTP_PORT}/metrics`
**注意事項**: キャッシュは異なる BE に保存される場合があります。全体を把握するには、**すべての BE** からメトリクスを収集する必要があります。

```Plain
# There are currently 1205 caches in the memory of this BE
doris_be_query_cache_sql_total_count 1205

# All caches currently take up about 44KB of BE memory
doris_be_query_cache_memory_total_byte 44101
```

## 6. メモリ制御

<!-- Knowledge type: parameter configuration -->
<!-- Applicable scenario: limiting the memory used by SQL Cache -->

### FE のメモリ制御

FE 内のキャッシュメタデータには**弱参照**が使用されます。FE のメモリが不足すると、最後に使用されてから最も時間が経過したメタデータが自動的に解放されます。メモリ使用量を制限するために、次のパラメータも使用できます。

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `sql_cache_manage_num` | 100 | メタデータエントリ数の上限。超過すると、最後に使用されてから最も時間が経過したエントリが自動的に解放される |
| `expire_sql_cache_in_fe_second` | 300 | メタデータの有効期限（秒）。この期間内にアクセスされなかった場合は自動的に解放される |
| `cache_result_max_row_count` | 3000 | 結果の行数の上限。超過すると SQL Cache は作成されない |
| `cache_result_max_data_size` | 31457280 (30MB) | 結果サイズの上限（バイト）。超過すると SQL Cache は作成されない |

**設定コマンド**（即時に反映され、すべての FE で設定が必要です。永続化するには `fe.conf` に記述します）:

```sql
-- Store at most 100 cache metadata entries
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');

-- Automatically release a cache metadata entry that has not been accessed for 300 seconds
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');

-- Do not create SQL Cache when the result has more than 3000 rows by default
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');

-- Do not create SQL Cache when the result is larger than 30MB by default
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```

### BE のメモリ制御

| パラメータ | デフォルト値（例） | 説明 |
| --- | --- | --- |
| `query_cache_max_size_mb` | 256 | キャッシュが使用するメモリの安定時の上限 |
| `query_cache_elasticity_size_mb` | 128 | 追加で使用できるメモリ領域。使用量が上限と追加領域の合計を超えると、上限を下回るまでキャッシュの削除が行われる |

**設定ファイル**: `be.conf`（変更後は BE の再起動が必要です）。

```conf
-- When the cache memory usage exceeds query_cache_max_size_mb + query_cache_elasticity_size_mb,
-- release the least recently used cache entries until the memory usage drops below query_cache_max_size_mb.
query_cache_max_size_mb = 256
query_cache_elasticity_size_mb = 128
```

## 7. トラブルシューティング: キャッシュが無効になる原因の調査

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: locating the cause when a query does not hit the SQL Cache -->

次の表に、キャッシュミスや無効化の主な原因と、それぞれの調査方法を示します。

| 番号 | 無効化の原因 | 典型的な操作 | 調査のヒント |
| --- | --- | --- | --- |
| 1 | テーブルまたはビューの構造変更 | `drop table`、`replace table`、`alter table`、`alter view` | テーブルとビューの最近の DDL 履歴を確認する |
| 2 | テーブルデータの変更 | `insert`、`delete`、`update`、`truncate` | データの取り込みログと変更ログを確認し、データのバージョンが変わったか調べる |
| 3 | ユーザー権限の取り消し | `revoke` | クエリ実行アカウントの権限変更を確認する |
| 4 | 非決定的関数の使用 | `select random()`、`select now()` など | 粒度の粗い関数または定数パラメータに切り替える |
| 5 | 変数の値の変更 | `select * from tbl where dt = @dt_var` | セッション変数の値が一致しているか確認する |
| 6 | Row Policy / Data Masking の変更 | 行ポリシーまたはマスキングポリシーの調整 | ポリシーの最近の変更記録を確認する |
| 7 | 結果の行数が上限を超過 | `cache_result_max_row_count` を超過（デフォルトは 3000 行） | しきい値を調整するか、結果セットを絞り込む |
| 8 | 結果サイズが上限を超過 | `cache_result_max_data_size` を超過（デフォルトは 30MB） | しきい値を調整するか、返すフィールドを減らす |

## 8. よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: answering common questions during use -->

**Q1: SQL Cache はデフォルトで有効ですか？**
A: デフォルトでは無効です。セッションレベルでは `set enable_sql_cache=true`、グローバルレベルでは `set global enable_sql_cache=true` を実行して有効にします。

**Q2: SQL Cache はどのテーブル種別をサポートしますか？**
A: 現在は OlapTable の内部テーブルと Hive の外部テーブルをサポートしています。

**Q3: リアルタイムで更新されるデータに SQL Cache を使用できますか？**
A: はい。ただし、データが更新されるたびにパーティションのバージョンが変わり、キャッシュが無効になるため、ヒット率は低くなります。SQL Cache は T+1 のオフライン分析により適しています。

**Q4: 複数テーブルの Join クエリでは、キャッシュはどのように無効になりますか？**
A: Join に含まれる**いずれかのテーブル**のデータが変更されると、パーティション ID またはバージョン番号が変わり、クエリ全体のキャッシュがヒットしなくなります。

**Q: 以前に二つの指標がキャッシュされました。今回は三つの指標を要求するクエリに、そのキャッシュを再利用できますか？**
A: いいえ。SQL Cache はクエリで指定したフィールドに厳密に対応する結果をキャッシュします。少ない指標のキャッシュでは多い指標のクエリを満たせないため、クエリを再実行する必要があります。

**Q5: `now()` 関数を使用すると、キャッシュはまったく利用できなくなりますか？**
A: いいえ。`now()` は秒単位の時刻を返すため、同じ秒内の同一クエリはキャッシュを再利用できます。ヒット可能な時間を延ばすには、`date(now())` を使用して日単位の粒度に変換してください。

**Q6: キャッシュデータはどこに保存されますか？**
A: 大部分の結果は BE のメモリ内に HashMap 構造で保存されます。結果が 0 行または 1 行だけの場合、FE が自身のメモリに直接保存します。

**Q7: FE の再起動後もキャッシュを利用できますか？**
A: FE 内のメタデータは失われ、監視メトリクスも 0 にリセットされます。BE のメモリ内の結果も、再起動後は無効になります。

## 9. 比較と参考情報

<!-- Knowledge type: comparison -->
<!-- Applicable scenario: choosing an appropriate caching strategy -->

| 比較項目 | SQL Cache | Partition Cache（利用できる場合） |
| --- | --- | --- |
| キャッシュの粒度 | SQL 全体の結果セット | パーティション単位の中間結果をキャッシュする |
| 適した更新パターン | T+1、低頻度の更新 | 一部のパーティションは頻繁に更新され、ほかは安定している |
| ヒット条件 | SQL テキストと依存するすべてのメタデータに変更がない | 関連するパーティションのバージョンに変更がない |
| 無効化の粒度 | 依存対象のいずれかが変更されるとキャッシュ全体が無効になる | キャッシュがミスしたパーティションのみ再計算が必要になる |

> 注意: この表の Partition Cache 列は比較のための参考情報です。実際に利用できるかどうかは、使用中の Doris バージョンの機能によって異なります。
