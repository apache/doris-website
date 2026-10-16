---
{
    "title": "Amazon Aurora MySQL",
    "language": "ja",
    "description": "Doris のストリーミング取り込みに向けて、Amazon Aurora MySQL で Binlog を有効にし、同期ユーザーを設定するための前提手順。",
    "keywords": [
        "Amazon Aurora MySQL",
        "Aurora Binlog configuration",
        "Doris streaming ingestion",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "binlog retention hours",
        "RDS Parameter Group",
        "MySQL CDC prerequisites"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Data source onboarding prerequisite configuration -->

Doris のストリーミング取り込みは、Amazon Aurora MySQL 互換エディションのバージョン **5.6、5.7、8.0.x** に対応しています。Aurora MySQL では Binlog がデフォルトで有効になっていないため、データを同期する前に Aurora クラスターで前提となる作業を完了する必要があります。Binlog の有効化と設定、同期ユーザーの作成、Binlog の保持期間の設定を行ってください。

このドキュメントは、Aurora MySQL のデータを Doris のストリーミング取り込みに追加するユーザー向けです。設定の一連の手順を説明します。

### 前提条件のチェックリスト {#prerequisite-checklist}

Doris に追加する前に、Aurora クラスターが以下の条件を満たしていることを確認してください。

| 確認項目 | 期待値 | 確認方法 |
| :--- | :--- | :--- |
| Binlog が有効かどうか | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog の形式 | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog の行イメージ | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| 同期ユーザー | レプリケーション権限を持つ専用アカウントが存在する | `SHOW GRANTS FOR ...;` を実行 |
| Binlog の保持期間 | 72 時間以上 | `CALL mysql.rds_show_configuration;` |

すべての条件を満たしている場合は、Doris のストリーミング取り込みの設定に進めます。満たしていない項目がある場合は、以下の手順に従って設定してください。

## ステップ 1: 現在の Binlog 設定を確認する {#step-1-check-the-current-binlog-configuration}

**Aurora のライターインスタンス**に接続し、次の SQL を実行して Binlog の状態を確認します。

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

結果に応じて、次の手順を選択してください。

- 三つの条件（`log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL`）をすべて満たす場合は、[ステップ 4: 同期ユーザーを作成する](#step-4-create-a-sync-user)に**直接進めます**。
- それ以外の場合は、[ステップ 2](#step-2-configure-the-cluster-parameter-group)に進み、クラスターパラメータグループを使用して Binlog を有効にします。

## ステップ 2: クラスターパラメータグループを設定する {#step-2-configure-the-cluster-parameter-group}

Aurora MySQL では、実行時パラメータを直接変更できません。**DB クラスターパラメータグループ（DB Cluster Parameter Group）**を使用して変更する必要があります。

手順:

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/)にログインします。
2. 左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. タイプに **DB Cluster Parameter Group** を選択し、対象クラスターに一致する Aurora MySQL のバージョンファミリーを選択します。
4. 新しく作成したクラスターパラメータグループを編集し、`binlog_format` を検索して値を `ROW` に設定します。

    ![MySQL の Binlog 形式の設定](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. `binlog_row_image` を検索して値を `FULL` に設定します。
6. **Save Changes** をクリックして保存します。

変更が必要な主なパラメータは次のとおりです。

| パラメータ | 推奨値 | 説明 |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | CDC 同期には行単位のログ記録が必要 |
| `binlog_row_image` | `FULL` | Binlog にすべての列の完全なイメージが含まれるようにする |

## ステップ 3: クラスターパラメータグループを適用して再起動する {#step-3-apply-the-cluster-parameter-group-and-restart}

新しく作成したパラメータグループを対象クラスターに関連付け、変更を有効にするためにライターインスタンスを再起動する必要があります。

1. RDS コンソールで対象の Aurora クラスターを選択し、**Modify** をクリックします。
2. **DB cluster parameter group** で、[ステップ 2](#step-2-configure-the-cluster-parameter-group)で作成したクラスターパラメータグループを選択します。
3. **Apply immediately** にチェックを入れ、変更をすぐに適用します。
4. 設定を有効にするため、Aurora の**ライターインスタンス**を再起動します。

:::caution
`binlog_format` パラメータの変更を有効にするには、Aurora のライターインスタンスを再起動する必要があります。この操作は利用の少ない時間帯に行ってください。
:::

再起動後、[ステップ 1](#step-1-check-the-current-binlog-configuration)の SQL を再度実行して確認します。三つのパラメータがすべて期待値と一致する必要があります。

## ステップ 4: 同期ユーザーを作成する {#step-4-create-a-sync-user}

権限管理と監査を容易にするため、Doris のストリーミング取り込み用に専用アカウントを作成します。

1. ユーザーを作成します。

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. 同期に必要な権限を付与します。

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

必要な権限の説明は次のとおりです。

| 権限 | 用途 |
| :--- | :--- |
| `SELECT` | 全量ロードの段階で業務テーブルのデータを読み取る |
| `REPLICATION SLAVE` | レプリケーションクライアントとして Binlog ストリームを読み取る |
| `REPLICATION CLIENT` | Binlog ファイルの位置などのメタデータを照会する |

## ステップ 5: Binlog の保持期間を設定する {#step-5-configure-the-binlog-retention-period}

Aurora はデフォルトで Binlog を比較的早く削除するため、中断後にレプリケーションを再開できなくなる可能性があります。障害発生時にもバイナリログを利用できるように、Binlog の保持期間を**72 時間以上**に設定することを推奨します。

ストアドプロシージャ `mysql.rds_set_configuration` を使用して設定します。

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

次の SQL で現在の設定を確認できます。

```sql
CALL mysql.rds_show_configuration;
```

:::caution
この設定項目が未設定の場合や、設定した期間が短すぎる場合は、バイナリログに欠落が生じ、Doris がレプリケーションを再開できなくなる可能性があります。
:::

## よくある質問 {#faq}

**Q1: `ROW` になるように `binlog_format` を変更したのに、値が反映されないのはなぜですか？**

A: Aurora MySQL では、実行時パラメータを直接変更できません。[ステップ 2](#step-2-configure-the-cluster-parameter-group)の説明に従って **DB クラスターパラメータグループ**を作成して関連付け、変更を有効にするために**ライターインスタンス**を再起動する必要があります。デフォルトのパラメータグループを変更しても反映されません。

**Q2: 確認と設定はライターインスタンスで行う必要がありますか？**

A: はい。Binlog は Aurora のライターインスタンスでのみ生成されるため、SQL による確認と同期ユーザーの作成はすべてライターインスタンスで行ってください。

**Q3: `binlog retention hours` を大きくしすぎると、どのような影響がありますか？**

A: ストレージの使用量が増えます。実際に必要な障害復旧のための時間幅に基づき、72 時間を下限として設定することを推奨します。

## トラブルシューティング {#troubleshooting}

| 症状 | 考えられる原因 | 対処方法 |
| :--- | :--- | :--- |
| `log_bin` がまだ `OFF` のまま | カスタムクラスターパラメータグループが関連付けられていない、またはライターインスタンスが再起動されていない | [ステップ 3](#step-3-apply-the-cluster-parameter-group-and-restart)に従ってパラメータグループを関連付け、ライターインスタンスを再起動する |
| `binlog_format` が `ROW` ではない | クラスターパラメータグループではなく、インスタンスパラメータグループを変更した | **DB クラスターパラメータグループ**で `binlog_format = ROW` に設定する |
| Doris の同期で Binlog ファイルが見つからないと報告される | `binlog retention hours` が短すぎて、Binlog が削除された | `mysql.rds_set_configuration` を使用して保持期間を 72 時間以上に延ばす |
| 同期ユーザーの認証に失敗する | ユーザーの接続元ホストの制限、または権限の不足 | ユーザーの接続元ホストが `'%'` または Doris BE の送信元 IP アドレスであり、`REPLICATION SLAVE, REPLICATION CLIENT` が付与されていることを確認する |
