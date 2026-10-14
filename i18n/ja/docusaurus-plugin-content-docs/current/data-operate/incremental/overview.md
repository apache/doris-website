---
{
    "title": "変更データと増分消費の概要",
    "language": "ja",
    "description": "Doris 5.0 の行単位の変更データ。Row Binlog は挿入、更新、削除を記録し、Table Stream はオフセットに基づいて変更を消費し、@incr は時間範囲を指定して変更を照会し、IVM は非同期マテリアライズドビューを行単位で維持します。",
    "keywords": [
        "Doris の増分消費",
        "Doris の変更データ",
        "Row Binlog",
        "行単位の binlog",
        "Table Stream",
        "増分ビューメンテナンス",
        "IVM",
        "@incr 増分クエリ",
        "増分 ETL",
        "下流テーブルの同期",
        "変更監査",
        "CDC",
        "変更データキャプチャ",
        "UPDATE_BEFORE UPDATE_AFTER",
        "append_only min_delta detail",
        "enable_feature_binlog",
        "enable_table_stream",
        "Merge-on-Write"
    ]
}
---

<!-- Knowledge type: Concept description + Selection guide -->
<!-- Use cases: Incremental ETL / Downstream sync / Change auditing / Incremental reads by time window -->

バージョン 5.0 以降、Doris は内部テーブルの行単位の変更ログ（Row Binlog）を記録でき、その変更を読み取る方法を二つ提供します。

- **Table Stream**: 消費位置を記憶する名前付きの消費オブジェクトです。読み取りごとに前回の消費以降の変更だけを返します。変更の読み取りと対象テーブルへの書き込みは、一つのトランザクションで実行されます。
- **増分クエリ（`@incr`）**: オブジェクトを作成せずに、指定した時間範囲内のテーブルの変更を読み取ります。

非同期マテリアライズドビューでは、上位の機能である[増分ビューメンテナンス（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)も利用できます。IVM では Doris が内部の Table Stream を自動的に管理し、行単位の変更を使ってマテリアライズドビューを維持します。マテリアライズドビューを維持する場合は、自分で Stream を作成して消費するのではなく、IVM を直接使用してください。

:::caution 実験的な機能
この機能はバージョン 5.0.0 から利用できます。実験的な機能であり、デフォルトでは無効です。有効にする方法は[前提条件](#prerequisites)を参照してください。
:::

## 解決できる問題

<!-- Knowledge type: Problem background -->

Doris 内で増分処理を行う場合、通常は次の問題があります。

| 問題 | 変更レコードがない場合 | Row Binlog がある場合 |
|---|---|---|
| 下流側が増分データを必要としているが、取得できない | 上流テーブルで毎日多くの更新や削除が発生するため、下流のレポート、ワイドテーブル、集約テーブルは全件を再計算するか、アプリケーションが管理する `update_time` カラムに依存するしかありません | Table Stream は二回の消費の間に発生した変更だけを返すため、下流側は増分データだけを処理できます |
| 更新と削除が見えない | Unique Key テーブルの更新は古い値を上書きし、削除された行は消えるため、後から何が変更または削除されたかを知る方法がありません | 各行の挿入、更新（更新前と更新後の値を含む）、削除がすべて記録されます |
| 複数テーブルの増分データの時点が一致しない | 増分データをディメンションテーブルと結合すると、ディメンションテーブルは「現在」の状態ですが、増分データは「過去のある期間」を対象としています | `<stream>@snapshot()` は消費オフセットと時点が一致するディメンションテーブルのイメージを読み取ります |

Row Binlog は、各行の挿入、更新（更新前と更新後の値を含む）、削除を、グローバルに単調増加するコミットタイムスタンプとともに記録します。Table Stream と増分クエリは、これらのレコードをそれぞれ異なる方法で読み取ります。

## 二つのレイヤー

<!-- Knowledge type: Architecture description -->

![増分消費の二つのレイヤー。Row Binlog が Table Stream と増分クエリに変更データを供給します](/images/next/data-operate/incremental/two-layers.png)

| 機能 | 必要なオブジェクト | 位置の管理者 | 適した用途 |
|---|---|---|---|
| Table Stream | `CREATE STREAM` が必要 | Doris がパーティションごとの消費オフセットを保持 | 継続的な増分 ETL、下流テーブルの同期、exactly-once の消費 |
| 増分クエリ `@incr` | 作成不要 | 利用者が時間範囲を指定 | アドホック分析、自身で位置を管理する外部スケジューラー |

IVM は、これら二つのレイヤーの上に位置します。Row Binlog が記録した変更と、Doris が自動的に作成する内部の Table Stream を利用しますが、ユーザーが操作する入口は引き続き `CREATE MATERIALIZED VIEW` と `REFRESH MATERIALIZED VIEW` です。

## 典型的なシナリオ

<!-- Knowledge type: Scenario description -->
<!-- Use cases: Incremental sync to a downstream table / Append-only logs / Change auditing and replay / Joining dimension tables -->

![四つの典型的なシナリオに推奨される増分消費方法](/images/next/data-operate/incremental/typical-scenarios.png)

| シナリオ | 推奨方法 | 仕組み | 参照先 |
|---|---|---|---|
| 下流テーブルへの増分同期 | `min_delta` タイプの Table Stream | 注文テーブルでは毎日多くのステータス更新が発生します。`min_delta` の Table Stream を作成し、`INSERT INTO downstream SELECT ... FROM the orders stream` を定期的に実行します。各回で処理するのは、二回の実行の間に発生した正味の変更だけです。これには、新規注文、ステータスが変わった注文（更新前と更新後の値を含む）、削除された注文が含まれます。変更の読み取りと下流テーブルへの書き込みは一つのトランザクションで実行されます。失敗すると自動的にロールバックされるため、変更が飛ばされたり、二重に消費されたりしません | [Table Stream の基本](table-stream) |
| 追記専用のログとイベントテーブル | `append_only` タイプの Table Stream | 挿入だけが発生する明細テーブルから、新しく書き込まれた行だけを最小限のコストで取得します | [消費タイプ](table-stream#consumption-types) |
| 変更の監査と再生 | `detail` タイプの Table Stream、または `DETAIL` モードの `@incr` | すべての変更履歴が必要な場合は、消費オフセットまたは時間範囲に基づいて行ごとの変更をエクスポートし、監査テーブルに保存します | [増分クエリ](incremental-query) |
| 増分データとディメンションテーブルの整合性のある結合 | `<stream>@snapshot()` | 注文の変更を消費する際に、users テーブルとの結合が必要です。`users_stream@snapshot()` は消費オフセットと時点が一致する users テーブルのイメージを読み取るため、新しい注文が古いユーザー情報と結合されたり、その逆が起きたりすることはありません | [スナップショット読み取り](table-stream-advanced#snapshot-reads-snapshot) |

## 機能対応表

### テーブルモデル

<!-- Knowledge type: Support matrix -->

| テーブルモデル | Row Binlog | 更新前イメージ | 利用できる変更タイプ |
|---|---|---|---|
| Duplicate Key | サポート | 非サポート | APPEND のみ |
| Unique Key（Merge-on-Write、cluster key なし） | サポート | サポート（`binlog.need_historical_value = true`） | APPEND / UPDATE_BEFORE / UPDATE_AFTER / DELETE |
| Unique Key（Merge-on-Read） | 非サポート | - | - |
| Aggregate Key | 非サポート | - | - |

その他の制限（自動採番カラム、VARIANT カラム、スキーマ変更の対象範囲など）は、[Row Binlog](row-binlog#supported-scope-and-limitations)に記載しています。

### 消費タイプの選択

<!-- Knowledge type: Selection guide -->

| 必要なデータ | 選択するタイプ | 備考 |
|---|---|---|
| 新しく挿入された行だけ | `append_only` | 更新と削除は出力されません。オーバーヘッドが最も小さいタイプです |
| 二回の消費の間に発生したキーごとの正味の変更 | `min_delta`（デフォルト） | 同じキーへの複数の変更は、一組の UPDATE_BEFORE と UPDATE_AFTER にまとめられます。挿入後に削除されたキーは出力されません |
| すべての変更の完全な記録 | `detail` | 行ごとに出力され、まとめられることはありません |

`min_delta` と `detail` の UPDATE_BEFORE 行および DELETE 行には更新前イメージが必要です。そのため、ベーステーブルは `binlog.need_historical_value` を有効にした MoW テーブルでなければなりません。

## 前提条件

<!-- Knowledge type: Environment requirements -->
<!-- Use cases: Pre-deployment check / Enabling the feature -->

1. **バージョン**: Doris 5.0.0 以降。
2. **FE の設定**: `fe.conf` で次の二項目を有効にし、FE を再起動します（どちらも動的に変更できる設定ではありません）。

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

    `enable_feature_binlog` は Row Binlog とコミットタイムスタンプ（TSO）の割り当てを制御し、`enable_table_stream` は Table Stream の DDL を制御します。後者が無効な場合、Stream の作成は `Table Stream is experimental. Please set enable_table_stream=true to enable it.` というエラーで失敗します。

3. **テーブル作成時に Row Binlog を有効にする**: Row Binlog を有効にできるのはテーブル作成時だけです。既存テーブルに対して `ALTER TABLE` で有効化することはできません。テーブルを作り直し、データを再ロードしてください。
4. **デプロイモード**: Row Binlog と Table Stream は、ストレージとコンピュートの一体型モードと分離型モードの両方で動作します。`@incr` による増分クエリは、現時点では一体型モードで使用してください。分離型モードへの対応はまだ進行中です。

:::tip 書き込みのオーバーヘッド
Row Binlog を有効にすると、書き込みのたびに変更レコードも生成して永続化します。また、MoW テーブルでは古い値の読み取りも必要です。そのため、データロードのスループットは大きく低下します。増分消費が本当に必要なテーブルだけで有効にし、本番環境に導入する前に実際の運用に近いワークロードで評価してください。
:::

## FAQ

<!-- Knowledge type: FAQ -->

| 質問 | 回答 |
|---|---|
| 既存テーブルで Row Binlog を有効にできますか？ | いいえ。Row Binlog を有効にできるのはテーブル作成時だけです。Row Binlog を有効にした新しいテーブルを作成し、データを再ロードしてください。詳しくは [Row Binlog](row-binlog#enabling-row-binlog) を参照してください |
| Table Stream と `@incr` のどちらを使うべきですか？ | exactly-once の処理が必要な継続的な増分 ETL には Table Stream を使用します。アドホック分析、過去の一定期間の変更の確認、または外部システムが消費位置をすでに管理している場合は `@incr` を使用します。詳しくは[Table Stream との違い](incremental-query#differences-from-table-stream)を参照してください |
| Stream の作成が `Table Stream is experimental. Please set enable_table_stream=true to enable it.` というエラーで失敗します | FE で `enable_table_stream` が有効になっていません。`fe.conf` を更新し、FE を再起動してください |
| ストレージとコンピュートの分離型モードで動作しますか？ | Row Binlog と Table Stream は動作します。`@incr` は現時点ではストレージとコンピュートの一体型モードで使用してください |
| Row Binlog は書き込みにどう影響しますか？ | 書き込みのたびに変更レコードも生成して永続化し、MoW テーブルでは古い値も読み取るため、データロードのスループットは大きく低下します。増分消費が必要なテーブルだけで有効にし、実際の運用に近いワークロードで評価してください |
| 変更レコードは自動的にクリーンアップされますか？ | はい。`binlog.ttl_seconds` が保持期間を制御します（デフォルトは一日）。増分読み取りでは期限切れのレコードが除外され、バックグラウンドのコンパクションでストレージが回収されます。保持期間内に変更を消費してください。詳しくは[保持とクリーンアップ](row-binlog#retention-and-cleanup)を参照してください |

## 関連ドキュメント

<!-- Knowledge type: Navigation -->

| ページ | 内容 |
|---|---|
| [クイックスタート](quick-start) | テーブルの作成、Stream の作成、データの書き込み、変更の確認、消費までを 10 分で説明します |
| [Row Binlog](row-binlog) | 有効化の方法、プロパティ、サポート範囲、変更レコードのモデル、DDL の制限、オーバーヘッド、トラブルシューティング |
| [増分クエリ](incremental-query) | `@incr` による時間範囲を指定したクエリと三つの増分モード |
| [Table Stream の基本](table-stream) | Stream の作成と管理、三つの消費タイプ、初期行、読み取りと消費の違い、仮想カラム |
| [Table Stream の高度な機能](table-stream-advanced) | パーティション単位のオフセット、スナップショットとリセット、整合性のある結合、同時消費、ベーステーブルの変更による影響、監視と復旧 |
| [増分ビューメンテナンス（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) | Row Binlog と内部の Table Stream を使って非同期マテリアライズドビューを行単位で維持します |
