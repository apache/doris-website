---
{
    "title": "S3 取り込みの概要",
    "sidebar_label": "概要",
    "language": "ja",
    "description": "Doris Streaming Job を使用した S3 の順序付き取り込み、通知による取り込み、または一回限りの取り込みを選択できます。共通オプション、監視、ジョブ管理のガイドも参照できます。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "概要"
    ]
}
---

Doris は **Streaming Job + S3 TVF** を使用して、S3 ファイルを既存の Doris テーブルにバッチ単位で取り込みます。ファイルの到着方法とジョブを継続して実行するかどうかに応じて、順序付き、通知による、または一回限りの取り込みを選択します。

## 取り込みモードの選択 {#choose-an-ingestion-mode}

| ガイド | モード | 使用する場面 | 完了条件 |
| --- | --- | --- | --- |
| [順序付き取り込み](./continuous-load-s3-ordered.md) | `ORDERED_LIST` （デフォルト） | タイムスタンプやゼロ埋めされたカウンターのように、キーが辞書順で増加する場合 | 継続して実行し、新しいファイルを待機 |
| [通知による取り込み](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID キーを使用する場合や、ファイルが任意の順序で到着し、AWS S3 イベントと専用の SQS キューを通じて検出する場合 | 継続して実行し、メッセージを待機 |
| [一回限りの取り込み](./continuous-load-s3-one-time.md) | `ONE_TIME` | 事前に用意した固定のファイル群、または単独のバックフィル | 最終バッチのコミット後に `FINISHED` になる |

通知による取り込みでは過去のオブジェクトはバックフィルされず、通知が繰り返されると重複して取り込まれる可能性があります。どのモードでも、取り込み中は取り込み元のオブジェクトを読み取り可能かつ変更されない状態に保つ必要があります。上記の各ガイドには、セットアップ、SQL の例、パラメーター、制限事項が記載されています。

## 関連ドキュメント {#related-documents}

- [Amazon S3 からの取り込み](../../data-source/amazon-s3.md)：S3 Load と TVF + INSERT。
- [継続的なデータロードの概要](./continuous-load-overview.md)：ジョブとタスクの確認、一時停止、再開、削除。
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)：ジョブ作成の構文。
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md)：ジョブ変更の構文。
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md)：接続、認証情報、ファイル形式のオプション。
