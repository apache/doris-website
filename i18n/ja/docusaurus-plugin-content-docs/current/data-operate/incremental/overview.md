---
{
    "title": "変更データと増分消費の概要",
    "language": "ja",
    "description": "Doris 5.0 の行単位の変更データ。changelog は挿入、更新、削除を記録し、Table Stream はオフセットに基づいて変更を消費し、@incr は時間範囲を指定して変更をクエリし、IVM は行単位で非同期マテリアライズドビューを維持します。",
    "keywords": [
        "Doris incremental consumption",
        "Doris change data",
        "Changelog",
        "row-level change log",
        "Table Stream",
        "Incremental View Maintenance",
        "IVM",
        "@incr incremental query",
        "incremental ETL",
        "downstream table sync",
        "change auditing",
        "CDC",
        "Change Data Capture",
        "UPDATE_BEFORE UPDATE_AFTER",
        "append_only min_delta detail",
        "enable_feature_changelog",
        "enable_table_stream",
        "Merge-on-Write"
    ]
}
---

<!-- Knowledge type: Concept description + Selection guide -->
<!-- Use cases: Incremental ETL / Downstream sync / Change auditing / Incremental reads by time window -->

バージョン 5.0 以降、Doris は内部テーブルの行単位の変更を changelog に記録できます。記録された変更は、次の方法で読み取れます。

- **Table Stream**: 消費した位置を記憶する、名前付きの消費オブジェクトです。読み取りのたびに前回の消費以降の変更だけを返し、変更の読み取りと対象テーブルへの書き込みを単一のトランザクションで実行します。
- **増分クエリ（`@incr`）**: オブジェクトを作成する必要はありません。指定した時間範囲内のテーブルの変更を読み取ります。

非同期マテリアライズドビューでは、さらに上位の機能である [Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) も利用できます。IVM は Doris に内部 Table Stream を自動管理させ、行単位の変更に基づいてマテリアライズドビューを維持します。マテリアライズドビューを維持する場合は、自分で Stream を作成して消費する代わりに、IVM を直接使用してください。

:::caution 実験的な機能
この機能はバージョン 5.0.0 から利用できます。実験的な機能であり、デフォルトでは無効です。有効にする方法は[前提条件](#prerequisites)を参照してください。
:::

## 解決できる課題 {#what-problems-it-solves}

<!-- Knowledge type: Problem background -->

Doris 内での増分処理では、通常、次のような課題があります。

| 課題 | 変更レコードがない場合 | changelog がある場合 |
|---|---|---|
| 下流側が増分データを必要としていても取得できない | 上流テーブルで毎日多くの更新や削除が発生するため、下流のレポート、ワイドテーブル、集計テーブルは全件再計算するか、アプリケーションが管理する `update_time` カラムに頼るしかありません | Table Stream は前回と今回の消費の間に発生した変更だけを返すため、下流側は増分データを処理できます |
| 更新や削除を把握できない | Unique Key テーブルの更新では古い値が上書きされ、削除された行は単に消えるため、後から何が変更または削除されたかを知ることができません | 各行の挿入、更新（更新前後の値を含む）、削除がすべて記録されます |
| 複数のテーブルの増分データで時点がそろわない | 増分データをディメンションテーブルと結合すると、ディメンションテーブルは「現在」の状態である一方、増分データは「過去のある期間」を対象としています | `<stream>@snapshot()` は、消費オフセットに対応する時点のディメンションテーブルのイメージを読み取ります |

changelog は、各行の挿入、更新（更新前後の値を含む）、削除を、グローバルに単調増加するコミットタイムスタンプとともに記録します。Table Stream と増分クエリは、それぞれ異なる方法でこれらのレコードを読み取ります。

## 二つのレイヤー {#two-layers}

<!-- Knowledge type: Architecture description -->

![増分消費の二つのレイヤー。changelog が Table Stream と増分クエリに変更を提供する](/images/next/data-operate/incremental/two-layers.png)

| 機能 | 必要なオブジェクト | 位置の管理者 | 適した用途 |
|---|---|---|---|
| Table Stream | `CREATE STREAM` が必要 | Doris がパーティションごとに消費オフセットを保持 | 継続的な増分 ETL、下流との同期、exactly-once の消費 |
| 増分クエリ `@incr` | 作成するオブジェクトなし | 利用者が時間範囲を指定 | アドホック分析、位置を独自に管理する外部スケジューラ |

IVM はこれら二つのレイヤーの上に位置します。changelog に記録された変更と、Doris が自動作成する内部 Table Stream を使用しますが、ユーザーが操作する入口は `CREATE MATERIALIZED VIEW` と `REFRESH MATERIALIZED VIEW` です。

## 典型的なシナリオ {#typical-scenarios}

<!-- Knowledge type: Scenario description -->
<!-- Use cases: Incremental sync to a downstream table / Append-only logs / Change auditing and replay / Joining dimension tables -->

![四つの典型的なシナリオで推奨される増分消費の方法](/images/next/data-operate/incremental/typical-scenarios.png)

| シナリオ | 推奨する方法 | 動作 | 参照先 |
|---|---|---|---|
| 下流テーブルへの増分同期 | `min_delta` タイプの Table Stream | 注文テーブルで毎日多くのステータス更新が発生する場合、`min_delta` タイプの Table Stream を作成し、`INSERT INTO downstream SELECT ... FROM the orders stream` を定期的に実行します。各実行では、前回と今回の間の正味の変更だけを処理します。対象には新規注文、ステータスが変わった注文（変更前後の値を含む）、削除された注文が含まれます。変更の読み取りと下流テーブルへの書き込みは単一のトランザクションで実行されます。失敗した場合は自動的にロールバックされるため、変更が飛ばされたり重複して消費されたりすることはありません | [Table Stream の基本](table-stream) |
| 追記のみのログとイベントテーブル | `append_only` タイプの Table Stream | 挿入だけが行われる明細テーブルから、新たに書き込まれた行だけを最小限のコストで取得します | [消費タイプ](table-stream#consumption-types) |
| 変更の監査と再生 | `detail` タイプの Table Stream、または `@incr` の `DETAIL` モード | すべての変更の完全な履歴が必要な場合は、消費オフセットまたは時間範囲に基づいて行単位の変更をエクスポートし、監査テーブルに保存します | [増分クエリ](incremental-query) |
| 増分データとディメンションテーブルの一貫した結合 | `<stream>@snapshot()` | 注文の変更を消費する際に users テーブルとの結合が必要な場合、`users_stream@snapshot()` は消費オフセットに対応する時点の users テーブルのイメージを読み取ります。これにより、新しい注文が古いユーザー情報と結合されることも、その逆もありません | [スナップショットの読み取り](table-stream-advanced#snapshot-reads-snapshot) |

## 機能対応表 {#capability-matrix}

### テーブルモデル {#table-models}

<!-- Knowledge type: Support matrix -->

| テーブルモデル | Changelog | 更新前のイメージ | 利用できる変更タイプ |
|---|---|---|---|
| Duplicate Key | 対応 | 非対応 | APPEND のみ |
| Unique Key (Merge-on-Write, without cluster key) | 対応 | 対応（`changelog.need_historical_value = true`） | APPEND / UPDATE_BEFORE / UPDATE_AFTER / DELETE |
| Unique Key (Merge-on-Read) | 非対応 | - | - |
| Aggregate Key | 非対応 | - | - |

その他の制限（自動採番カラム、VARIANT カラム、スキーマ変更の対象範囲など）は、[Changelog](changelog#supported-scope-and-limitations) に記載されています。

### 消費タイプの選択 {#choosing-a-consumption-type}

<!-- Knowledge type: Selection guide -->

| 必要なデータ | 選択するタイプ | 補足 |
|---|---|---|
| 新たに挿入された行のみ | `append_only` | 更新と削除は出力されません。オーバーヘッドが最も小さいタイプです |
| 前回と今回の消費の間におけるキーごとの正味の変更 | `min_delta`（デフォルト） | 同じキーに対する複数の変更は、一組の UPDATE_BEFORE と UPDATE_AFTER にまとめられます。挿入後に削除されたキーは出力されません |
| すべての変更の完全な記録 | `detail` | 行ごとに出力され、まとめられることはありません |

`min_delta` と `detail` の UPDATE_BEFORE 行および DELETE 行には更新前のイメージが必要です。そのため、ベーステーブルは `changelog.need_historical_value` を有効にした MoW テーブルでなければなりません。

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->
<!-- Use cases: Pre-deployment check / Enabling the feature -->

1. **バージョン**: Doris 5.0.0 以降。
2. **FE の設定**: `fe.conf` で次の二つの項目を有効にし、FE を再起動します（どちらも動的な設定ではありません）。

    ```text
    enable_feature_changelog = true
    enable_table_stream = true
    ```

    `enable_feature_changelog` は changelog とコミットタイムスタンプ（TSO）の割り当てを制御します。`enable_feature_binlog` は CCR binlog のみを制御するため、ここでは不要です。`enable_table_stream` は Table Stream の DDL を制御します。無効の場合、Stream の作成は `Table Stream is experimental. Please set enable_table_stream=true to enable it.` というエラーで失敗します。

3. **テーブル作成時に changelog を有効化**: Changelog を有効にできるのはテーブル作成時だけです。既存のテーブルで `ALTER TABLE` を使って有効にすることはできません。テーブルを再作成してデータを再ロードしてください。
4. **デプロイモード**: Changelog と Table Stream は、ストレージとコンピュートの統合モード、およびコンピュートとストレージの分離モードの両方で動作します。`@incr` による増分クエリは、現時点では統合モードで使用してください。分離モードへの対応は現在進められています。

:::tip 書き込み時のオーバーヘッド
changelog を有効にすると、書き込みのたびに変更レコードの生成と永続化も行われ、MoW テーブルでは古い値の読み取りも必要になります。そのため、データロードのスループットが目に見えて低下します。増分消費が本当に必要なテーブルでのみ有効にし、本番環境に導入する前に実際のワークロードに近い条件で評価してください。
:::

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

| 質問 | 回答 |
|---|---|
| 既存のテーブルで changelog を有効にできますか？ | できません。Changelog を有効にできるのはテーブル作成時だけです。changelog を有効にした新しいテーブルを作成し、データを再ロードしてください。詳しくは [Changelog](changelog#enabling-changelog) を参照してください |
| Table Stream と `@incr` のどちらを使うべきですか？ | exactly-once の消費が必要な継続的な増分 ETL には Table Stream を使用します。アドホック分析、過去の一定期間の変更の確認、または位置を独自に管理している外部システムには `@incr` を使用します。詳しくは [Table Stream との違い](incremental-query#differences-from-table-stream) を参照してください |
| Stream の作成時に `Table Stream is experimental. Please set enable_table_stream=true to enable it.` というエラーが出ます | FE で `enable_table_stream` が有効になっていません。`fe.conf` を更新して FE を再起動してください |
| コンピュートとストレージの分離モードでも動作しますか？ | Changelog と Table Stream は動作します。`@incr` は現時点ではストレージとコンピュートの統合モードで使用してください |
| changelog は書き込みにどう影響しますか？ | 書き込みのたびに変更レコードの生成と永続化も行われ、MoW テーブルでは古い値も読み取るため、データロードのスループットが目に見えて低下します。増分消費が必要なテーブルでのみ有効にし、実際のワークロードに近い条件で評価してください |
| 変更レコードは自動的に削除されますか？ | はい。`changelog.ttl_seconds` が保持期間を制御します（デフォルトは一日）。増分読み取りでは期限切れのレコードが除外され、バックグラウンドの compaction によって使用領域が回収されます。保持期間内に変更を消費してください。詳しくは [保持とクリーンアップ](changelog#retention-and-cleanup) を参照してください |

## 関連ドキュメント {#reading-guide}

<!-- Knowledge type: Navigation -->

| ページ | 内容 |
|---|---|
| [クイックスタート](quick-start) | テーブルの作成、Stream の作成、データの書き込み、変更の確認、消費を 10 分で体験する手順 |
| [Changelog](changelog) | 有効化の方法、プロパティ、対応範囲、変更レコードのモデル、DDL の制限、オーバーヘッド、トラブルシューティング |
| [増分クエリ](incremental-query) | `@incr` による時間範囲を指定したクエリと、三つの増分モード |
| [Table Stream の基本](table-stream) | Stream の作成と管理、三つの消費タイプ、初期行、読み取りと消費の違い、仮想カラム |
| [Table Stream の高度な機能](table-stream-advanced) | パーティション単位のオフセット、スナップショットとリセット、一貫した結合、同時消費、ベーステーブルの変更による影響、監視と復旧 |
| [Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) | changelog と内部 Table Stream を使用して、非同期マテリアライズドビューを行単位で維持する方法 |
