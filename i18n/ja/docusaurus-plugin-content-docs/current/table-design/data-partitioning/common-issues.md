---
{
    "title": "テーブル作成時によくある問題",
    "language": "ja",
    "description": "Apache Doris のテーブル作成に関するトラブルシューティングガイド。構文エラー、Failed to create partition のタイムアウト、Too many open files、コマンドが応答を返さない場合などの原因と対処方法を説明します。",
    "keywords": [
        "Doris のテーブル作成失敗",
        "Failed to create partition",
        "Too many open files",
        "tablet_create_timeout_second",
        "テーブル作成のタイムアウト",
        "テーブル作成時の構文エラー"
    ]
}
---

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Table creation failure troubleshooting / Timeout tuning -->

この記事では、テーブル作成時に遭遇しやすい状況ごとに、原因の調査方法と対処方法を説明します。

## シナリオ 1: CREATE TABLE 文の構文エラー

長い CREATE TABLE 文で構文エラーが発生した場合、エラーメッセージに十分な情報が表示されないことがあります。主な原因は次のとおりです。

| 原因 | 調査と修正の方法 |
| --- | --- |
| 構文の誤り | `HELP CREATE TABLE;` をよく読み、該当する構文と照らし合わせて確認します |
| 予約語の使用 | 指定した名前が予約語と重複する場合は、バッククォート `` ` `` で囲みます。指定する名前はすべてバッククォートで囲むことを推奨します |
| 中国語の文字または全角文字 | UTF-8 以外でエンコードされた中国語の文字や、見えにくい全角文字（全角スペースや全角句読点など）は、構文エラーの原因になります。不可視文字を表示できるテキストエディタで確認します |

## シナリオ 2: テーブル作成時に `Failed to create partition [xxx]. Timeout` が報告される

Doris はパーティションを一つずつ作成します。パーティションの作成に失敗すると、上記のエラーが報告されます。

CREATE TABLE 文でパーティションを明示的に定義していない場合でも、Doris はそのテーブルに変更不可のデフォルトパーティションを作成します。そのため、テーブル作成中に問題が発生した場合にも `Failed to create partition` が報告されます。

このエラーは通常、BE がデータシャード（タブレット）を作成するときに問題が発生することで起こります。

### 調査手順

1. **作成に失敗した Backend とタブレットを特定する**

    該当時刻の `fe.log` で `Failed to create partition` のログを検索します。ログには `{10001-10010}` のような数字の組が含まれています。

    - 最初の数字（`10001`）: Backend ID
    - 次の数字（`10010`）: タブレット ID

    この例は、タブレット ID `10010` の作成が ID `10001` の Backend で失敗したことを示します。

2. **BE のログでエラーメッセージを確認する**

    該当する Backend の `be.INFO` ログを開き、該当時間帯のタブレット ID に関連するログを検索して、具体的なエラーメッセージを確認します。

3. **よくあるエラーに応じて対処する**

### タブレット作成に失敗する主な原因

| エラーの状況 | 考えられる原因 | 推奨される対処方法 |
| --- | --- | --- |
| BE が関連タスクを受信していない（`be.INFO` にタブレット ID に関連するログが見つからない）、または BE はタブレットの作成に成功したが結果の報告に失敗した | FE と BE の間に接続の問題がある | [インストールとデプロイ](../../install/deploy-manually/integrated-storage-compute-deploy-manually)を参照し、FE と BE の間のネットワーク接続を確認します |
| メモリの事前割り当てに失敗した | テーブルの一行のバイト長が 100 KB を超えている | テーブルスキーマを調整し、一行のデータ長を短くします |
| `Too many open files` | 開いているファイルハンドルの数が Linux システムの上限を超えている | Linux システムのファイルハンドル数の上限を変更します |

### テーブル作成のタイムアウトを調整する

データシャードの作成がタイムアウトするだけの場合は、`fe.conf` の次の二つのパラメータでタイムアウトを延長できます。

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `tablet_create_timeout_second` | 1 秒 | 単一のタブレットを作成する際のタイムアウト |
| `max_create_table_timeout_second` | 60 秒 | テーブル作成処理全体の最大タイムアウト |

全体のタイムアウトは、次の式で計算されます。

```text
min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)
```

パラメータの詳細については、[FE の設定](../../admin-manual/config/fe-config)を参照してください。

## シナリオ 3: CREATE TABLE コマンドが長時間応答を返さない

Doris の CREATE TABLE コマンドは同期的に実行されます。現在のタイムアウトは、比較的単純な方法で設定されています。

```text
timeout = tablet num * replication num (seconds)
```

状況に応じた対処方法は次のとおりです。

- 多数のデータシャードを作成し、その一部で作成に失敗した場合、長いタイムアウトの後でようやくエラーが返されることがあります。
- 通常、CREATE TABLE 文は数秒から数十秒以内に結果を返します。
- 一分経っても結果が返らない場合は、処理を中止し、FE または BE のログで関連するエラーを確認します。

## 参考情報

データのパーティショニングの詳細については、次を参照してください。

- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) コマンドのリファレンスを参照してください
