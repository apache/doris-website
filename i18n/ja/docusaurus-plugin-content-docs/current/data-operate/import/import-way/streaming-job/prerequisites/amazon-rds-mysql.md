---
{
    "title": "Amazon RDS MySQL",
    "language": "ja",
    "description": "Amazon RDS MySQL で Binlog を有効にし、パラメータグループを設定して、Doris ストリーミング取り込みの前提条件となる同期ユーザーを作成する方法。",
    "keywords": [
        "Amazon RDS MySQL",
        "Doris ストリーミング取り込み",
        "MySQL Binlog",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "RDS パラメータグループ",
        "binlog retention hours",
        "CDC 同期"
    ]
}
---

:::caution 実験的機能

Doris の継続取り込みは実験的機能であり、Doris 4.1.5 以降でサポートされています。

:::

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Environment configuration -->

Doris ストリーミング取り込みは Amazon RDS MySQL からのデータ同期をサポートします。互換性のあるバージョンは **MySQL 5.6、5.7、8.0.x** です。同期タスクを開始する前に、RDS インスタンスで Binlog が有効になっており、変更ログが正しい形式で記録されていることを確認する必要があります。

このドキュメントは、Amazon RDS MySQL のデータをストリーミング取り込み（CDC）によって Doris に同期する必要があるユーザーを対象とし、シナリオに沿った順序で、すべての前提設定を説明します。

## 前提条件チェックリスト {#prerequisite-checklist}

開始する前に、次の条件を確認してください。

| チェック項目 | 期待値 | 説明 |
| --- | --- | --- |
| `log_bin` | `ON` | Binlog が有効 |
| `binlog_format` | `ROW` | 行モードで変更を記録 |
| `binlog_row_image` | `FULL` | 完全な行イメージを記録 |
| 同期ユーザー | 作成済み | `SELECT`、`REPLICATION SLAVE`、`REPLICATION CLIENT` 権限を持つ |
| Binlog 保持時間 | 少なくとも 72 時間 | 同期を中断させるログの早期クリーンアップを防止 |

上記のいずれかを満たしていない場合は、以下の手順に従って順に設定してください。

## 手順 1：現在の Binlog 設定を確認する {#step-1-check-the-current-binlog-configuration}

**目的**：RDS インスタンスの現在の Binlog 状態を確認し、パラメータグループを変更する必要があるか判断します。

RDS インスタンスに接続した後、次の SQL を実行します。

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

**結果の解釈方法**：

-   `log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL` の場合、追加設定は不要です。[手順 4：同期ユーザーを作成する](#step-4-create-a-sync-user) に直接進めます。
-   いずれかの条件を満たさない場合は、手順 2 と手順 3 に進みます。

## 手順 2：パラメータグループを作成して設定する {#step-2-create-and-configure-a-parameter-group}

**目的**：AWS コンソールでカスタムパラメータグループを作成し、Binlog 関連パラメータを Doris ストリーミング取り込みに必要な値に調整します。

手順は次のとおりです。

1.  [AWS RDS コンソール](https://console.aws.amazon.com/rds/) にログインします。
2.  左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3.  対応する MySQL バージョンファミリーを選択し、新しいパラメータグループを作成します。
4.  パラメータグループを編集し、`binlog_format` を検索して、値を `ROW` に設定します：

    ![MySQL Binlog Format Setting](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5.  同様に `binlog_row_image` を検索し、値を `FULL` に設定します。
6.  **Save Changes** をクリックして保存します。

変更が必要なパラメータを以下にまとめます。

| パラメータ | 目標値 | 目的 |
| --- | --- | --- |
| `binlog_format` | `ROW` | データ変更を行レベルで記録し、CDC 同期に必要 |
| `binlog_row_image` | `FULL` | 各変更の前後の完全な行データを記録 |

## 手順 3：パラメータグループを適用してインスタンスを再起動する {#step-3-apply-the-parameter-group-and-restart-the-instance}

**目的**：新しいパラメータグループを対象の RDS インスタンスに関連付け、再起動して設定を有効にします。

手順は次のとおりです。

1.  RDS コンソールで対象のインスタンスを選択し、**Modify** をクリックします。
2.  **DB parameter group** で新しく作成したパラメータグループを選択します。
3.  **Apply immediately** を選択して変更を直ちに適用します。
4.  RDS インスタンスを再起動して設定を有効にします。

:::caution
`binlog_format` パラメータを変更した場合、反映するには RDS インスタンスの再起動が必要です。この操作は業務の閑散時間帯に実行してください。
:::

## 手順 4：同期ユーザーを作成する {#step-4-create-a-sync-user}

**目的**：最小権限の原則に従い、Doris ストリーミング取り込みで使用する専用アカウントを作成します。

1.  専用ユーザーを作成します。

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2.  同期に必要な権限を付与します。

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

必要な権限の説明：

| 権限 | 目的 |
| --- | --- |
| `SELECT` | 既存データを読み取る（全量データロードフェーズ） |
| `REPLICATION SLAVE` | レプリカとして Binlog を取得 |
| `REPLICATION CLIENT` | プライマリの Binlog ステータスをクエリ |

## 手順 5：Binlog 保持時間を設定する {#step-5-configure-binlog-retention}

**目的**：デフォルトでは、Amazon RDS MySQL はバイナリログをできるだけ早く削除します。障害発生時にもレプリケーションに使用する Binlog ファイルを利用できるよう、Binlog 保持時間を少なくとも **72 時間** に設定することを推奨します。

`mysql.rds_set_configuration` ストアドプロシージャを使用して保持時間を設定します。

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

:::caution
この設定項目を設定しないか、間隔を短く設定すると、バイナリログに欠落が生じ、Doris がレプリケーションを再開できなくなる可能性があります。
:::

## よくある質問（FAQ） {#frequently-asked-questions-faq}

**Q1：`binlog_format` を変更した後、インスタンスを再起動する必要がありますか？**

はい。`binlog_format` は静的パラメータであり、反映するには RDS インスタンスを再起動する必要があります。操作は業務の閑散時間帯に実行してください。

**Q2：`binlog_row_image` を `FULL` に設定する必要があるのはなぜですか？**

Doris ストリーミング取り込みでは、`UPDATE` と `DELETE` 操作を正しく再構築するために、各変更の前後の完全な行データが必要です。`MINIMAL` または `NOBLOB` に設定すると、同期エラーや不完全なデータが発生します。

**Q3：同じパラメータグループを複数の RDS インスタンスで再利用できますか？**

はい。同じバージョンファミリーに属する複数の RDS インスタンスは、すべて同じ Binlog 設定を必要とする限り、同じパラメータグループを共有できます。

**Q4：Binlog 保持時間をもっと長く設定できますか？**

はい。`binlog retention hours` は 1～168 時間（最大 7 日間）の値をサポートします。保持期間が長いほど復旧できる時間枠は広がりますが、より多くのストレージ容量を消費します。

## トラブルシューティング（Troubleshooting） {#troubleshooting}

| 症状 | 考えられる原因 | 解決策 |
| --- | --- | --- |
| `SHOW VARIABLES LIKE 'log_bin'` が `OFF` を返す | インスタンスで自動バックアップが有効になっていないため、Binlog が有効になっていない | RDS コンソールでインスタンスの自動バックアップを有効にします。Binlog は自動的に有効になります |
| 変更後も `binlog_format` が `MIXED` または `STATEMENT` のまま | インスタンスが再起動されていないか、関連付けられたパラメータグループが正しくない | 新しいパラメータグループが関連付けられていることを確認し、インスタンスを再起動します |
| Doris の同期で `binary log not found` が報告される | Binlog が削除されている | `binlog retention hours` を増やし、Doris 同期タスクを再起動します |
| 同期ユーザーが接続できない | ホストの許可リストまたはパスワードが正しくない | `'doris_sync'@'%'` のホスト指定子が Doris ノードの送信元 IP と一致するか確認します |
| 権限不足エラー | `REPLICATION SLAVE` などの権限が不足している | 手順 4 の `GRANT` 文を再実行します |
