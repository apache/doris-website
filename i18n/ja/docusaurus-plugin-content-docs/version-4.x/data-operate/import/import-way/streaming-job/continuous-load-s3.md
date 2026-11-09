---
{
    "title": "S3 データロードの概要",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris Streaming Job による S3 データロードで、順序付き、通知、または一度限りの取り込みを選択し、共通オプション、監視、ジョブ管理のガイドを確認できます。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "概要"
    ]
}
---

:::caution 実験的機能

Doris の継続的データロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

Doris は **Streaming Job + S3 TVF** を使用して、S3 ファイルを既存の Doris テーブルにバッチ単位で取り込みます。ファイルの到着方法とジョブを継続実行するかどうかに応じて、順序付き、通知、または一度限りの取り込みを選択します。通知取り込みと一度限りの取り込みは、Doris 4.1.6 以降でサポートされます。

## 取り込みモードを選択する {#choose-an-ingestion-mode}

| ガイド | モード | 使用するタイミング | 完了条件 |
| --- | --- | --- | --- |
| [順序付き取り込み](./continuous-load-s3-ordered.md) | `ORDERED_LIST`（デフォルト） | キーが辞書順で増加する場合（タイムスタンプやゼロ埋めカウンタなど） | 継続的に実行され、新しいファイルを待機 |
| [通知取り込み](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID キーや任意の順序で到着するファイルを、AWS S3 イベントと専用 SQS キューを通じて検出する場合 | 継続的に実行され、メッセージを待機 |
| [一度限りの取り込み](./continuous-load-s3-one-time.md) | `ONE_TIME` | 準備済みの静的ファイルセットまたは独立したバックフィル | 最後のバッチがコミットされた後に `FINISHED` に移行 |

通知取り込みでは過去のオブジェクトのバックフィルは行われず、通知が重複するとデータが重複して取り込まれる可能性があります。すべてのモードで、取り込み中にソースオブジェクトを読み取り可能で変更されない状態に維持する必要があります。各ガイドには、セットアップ手順、SQL の例、パラメータ、制限事項が記載されています。

## 関連ドキュメント {#related-documents}

- [Amazon S3 データロード](../../data-source/amazon-s3.md)：S3 Load と TVF + INSERT。
- [継続的データロードの概要](./continuous-load-overview.md)：ジョブとタスクの状態確認、ジョブの一時停止、再開、削除。
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)：ジョブ作成構文。
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)：ジョブ変更構文。
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md)：接続、認証情報、ファイル形式のオプション。
