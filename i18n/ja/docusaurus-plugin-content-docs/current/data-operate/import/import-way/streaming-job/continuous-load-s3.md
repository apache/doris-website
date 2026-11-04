---
{
    "title": "S3 データ取り込みの概要",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris Streaming Job を使用した S3 取り込みでは、順序付き、通知、または一度限りの方式を選択でき、共通オプション、監視、ジョブ管理のガイドを確認できます。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "概要"
    ]
}
---

:::caution 実験的機能

Doris の継続的データロードは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

Doris は **Streaming Job + S3 TVF** を使用して、S3 ファイルを既存の Doris テーブルにバッチで取り込みます。ファイルの到着方法とジョブを継続実行するかどうかに応じて、順序付き取り込み、通知取り込み、または一度限りの取り込みを選択します。通知取り込みと一度限りの取り込みは、Doris 4.1.6 以降でサポートされています。

## 取り込みモードを選択する {#choose-an-ingestion-mode}

| ガイド | モード | 使用するタイミング | 完了条件 |
| --- | --- | --- | --- |
| [順序付き取り込み](./continuous-load-s3-ordered.md) | `ORDERED_LIST`（デフォルト） | キーが辞書順で増加する場合（タイムスタンプやゼロ埋めカウンターなど） | 継続的に実行され、新しいファイルを待機します |
| [通知取り込み](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID キー、または任意の順序で到着するファイルを、AWS S3 イベントと専用 SQS キューを通じて検出する場合 | 継続的に実行され、メッセージを待機します |
| [一度限りの取り込み](./continuous-load-s3-one-time.md) | `ONE_TIME` | 準備済みの静的ファイルセット、または個別のバックフィル | 最終バッチがコミットされると `FINISHED` に移行します |

通知取り込みでは過去のオブジェクトをバックフィルせず、通知が重複すると取り込みが重複する可能性があります。すべてのモードで、取り込み中にソースオブジェクトを読み取り可能かつ不変の状態に保つ必要があります。上記の各ガイドには、セットアップ、SQL 例、パラメータ、制限事項が含まれています。

## 関連ドキュメント {#related-documents}

- [Amazon S3 のデータ取り込み](../../data-source/amazon-s3.md)：S3 Load と TVF + INSERT。
- [継続的データロードの概要](./continuous-load-overview.md)：ジョブとタスクの確認、ジョブの一時停止、再開、削除。
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)：ジョブ作成構文。
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)：ジョブ変更構文。
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md)：接続、認証情報、ファイル形式のオプション。
