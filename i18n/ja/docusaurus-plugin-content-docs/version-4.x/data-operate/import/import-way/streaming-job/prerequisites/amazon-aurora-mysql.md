---
{
    "title": "Amazon Aurora MySQL",
    "language": "ja",
    "description": "Doris のストリーミング取り込みに向けて、Amazon Aurora MySQL で Binlog を有効化し、同期ユーザーを設定するための前提手順。",
    "keywords": [
        "Amazon Aurora MySQL",
        "Aurora Binlog の設定",
        "Doris ストリーミング取り込み",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "binlog retention hours",
        "RDS Parameter Group",
        "MySQL CDC の前提条件"
    ]
}
---

:::caution 実験的機能

Doris の継続的なデータロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Data source onboarding prerequisite configuration -->

Doris のストリーミング取り込みは、Amazon Aurora MySQL-Compatible Edition のバージョン **5.6、5.7、8.0.x** をサポートします。Aurora MySQL ではデフォルトで Binlog が有効になっていないため、データを同期する前に、Aurora クラスターで Binlog の有効化と設定、同期ユーザーの作成、Binlog の保持期間の設定を行う必要があります。

このドキュメントは、Aurora MySQL のデータを Doris のストリーミング取り込みに連携するユーザーを対象に、設定の全手順を説明します。

### 前提条件のチェックリスト {#prerequisite-checklist}

Doris に連携する前に、Aurora クラスターが次の条件を満たしていることを確認してください。

| 確認項目 | 期待値 | 確認方法 |
| :--- | :--- | :--- |
| Binlog が有効か | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog の形式 | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog の行イメージ | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| 同期ユーザー | レプリケーション権限を持つ専用アカウントが存在する | `SHOW GRANTS FOR ...;` を実行 |
| Binlog の保持期間 | 72 時間以上 | `CALL mysql.rds_show_configuration;` |

すべての条件を満たしている場合は、Doris のストリーミング取り込みの設定に直接進めます。満たしていない項目がある場合は、以下の手順に従って設定してください。

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

結果に応じて、次の手順を選んでください。

- 3 つの条件（`log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL`）をすべて満たしている場合は、[ステップ 4: 同期ユーザーを作成する](#step-4-create-a-sync-user)に**直接進めます**。
- それ以外の場合は、[ステップ 2](#step-2-configure-the-cluster-parameter-group)に進み、クラスターパラメータグループを使用して Binlog を有効にします。

## ステップ 2: クラスターパラメータグループを設定する {#step-2-configure-the-cluster-parameter-group}

Aurora MySQL では実行時パラメータを直接変更できません。**DB Cluster Parameter Group** を使用して変更する必要があります。

手順:

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/)にログインします。
2. 左側のナビゲーションペインで **パラメータグループ**を選択し、**パラメータグループの作成**をクリックします。
3. タイプに **DB Cluster Parameter Group** を選び、対象クラスターに一致する Aurora MySQL のバージョンファミリーを選択します。
4. 新しく作成したクラスターパラメータグループを編集し、`binlog_format` を検索して値を `ROW` に設定します。

    ![MySQL の Binlog 形式の設定](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. `binlog_row_image` を検索し、値を `FULL` に設定します。
6. **変更を保存**をクリックします。

変更が必要な主なパラメータは次のとおりです。

| パラメータ | 推奨値 | 説明 |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | CDC 同期には行単位のログ記録が必要 |
| `binlog_row_image` | `FULL` | Binlog にすべての列の完全なイメージを含める |

## ステップ 3: クラスターパラメータグループを適用して再起動する {#step-3-apply-the-cluster-parameter-group-and-restart}

新しく作成したパラメータグループを対象クラスターに関連付け、変更を有効にするためにライターインスタンスを再起動する必要があります。

1. RDS コンソールで対象の Aurora クラスターを選択し、**変更**をクリックします。
2. **DB cluster parameter group** で、[ステップ 2](#step-2-configure-the-cluster-parameter-group)で作成したクラスターパラメータグループを選択します。
3. **すぐに適用**を選択して、変更を直ちに適用します。
4. 設定を有効にするため、Aurora の**ライターインスタンス**を再起動します。

:::caution
`binlog_format` パラメータの変更を有効にするには、Aurora のライターインスタンスの再起動が必要です。この操作は負荷の低い時間帯に実施してください。
:::

再起動後、[ステップ 1](#step-1-check-the-current-binlog-configuration)の SQL を再実行して確認します。3 つのパラメータがすべて期待値と一致している必要があります。

## ステップ 4: 同期ユーザーを作成する {#step-4-create-a-sync-user}

権限管理と監査を容易にするため、Doris のストリーミング取り込み用の専用アカウントを作成します。

1. ユーザーを作成します。

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. 同期に必要な権限を付与します。

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

必要な権限は次のとおりです。

| 権限 | 用途 |
| :--- | :--- |
| `SELECT` | 全量データロードの段階で業務テーブルのデータを読み取る |
| `REPLICATION SLAVE` | レプリケーションクライアントとして Binlog ストリームを読み取る |
| `REPLICATION CLIENT` | Binlog ファイルの位置などのメタデータをクエリする |

## ステップ 5: Binlog の保持期間を設定する {#step-5-configure-the-binlog-retention-period}

Aurora はデフォルトでは Binlog を比較的早く削除するため、レプリケーションが中断すると再開できなくなる可能性があります。障害時にもバイナリログを利用できるよう、Binlog の保持期間を**少なくとも 72 時間**に設定することを推奨します。

`mysql.rds_set_configuration` ストアドプロシージャを使用して設定します。

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

現在の設定は、次の SQL で確認できます。

```sql
CALL mysql.rds_show_configuration;
```

:::caution
この設定項目が未設定の場合や保持期間が短すぎる場合、バイナリログに欠落が生じ、Doris がレプリケーションを再開できなくなる可能性があります。
:::

## よくある質問 {#faq}

**Q1: `binlog_format` を変更したのに、値がまだ `ROW` にならないのはなぜですか？**

A: Aurora MySQL では実行時パラメータを直接変更できません。[ステップ 2](#step-2-configure-the-cluster-parameter-group)の説明に従って **DB Cluster Parameter Group** を作成して関連付け、変更を有効にするために**ライターインスタンス**を再起動する必要があります。デフォルトのパラメータグループを変更しても反映されません。

**Q2: 確認と設定はライターインスタンスで行う必要がありますか？**

A: はい。Binlog は Aurora のライターインスタンスでのみ生成されるため、すべての SQL による確認と同期ユーザーの作成はライターインスタンスで行ってください。

**Q3: `binlog retention hours` を大きく設定しすぎると、どのような影響がありますか？**

A: ストレージの使用量が増えます。実際に必要な障害復旧時間を踏まえ、最低 72 時間を確保して設定することを推奨します。

## トラブルシューティング {#troubleshooting}

| 症状 | 考えられる原因 | 解決方法 |
| :--- | :--- | :--- |
| `log_bin` が依然として `OFF` | カスタムのクラスターパラメータグループが関連付けられていない、またはライターインスタンスが再起動されていない | [ステップ 3](#step-3-apply-the-cluster-parameter-group-and-restart)に従ってパラメータグループを関連付け、ライターインスタンスを再起動する |
| `binlog_format` が `ROW` ではない | クラスターパラメータグループではなく、インスタンスパラメータグループを変更した | **DB Cluster Parameter Group** で `binlog_format = ROW` を設定する |
| Doris の同期で Binlog ファイルが見つからないと報告される | `binlog retention hours` が短すぎて、Binlog が削除された | `mysql.rds_set_configuration` を使用し、保持期間を少なくとも 72 時間に延ばす |
| 同期ユーザーの認証に失敗する | ユーザーの接続元ホストの制限、または権限不足 | ユーザーの接続元ホストが `'%'` または Doris BE の送信元 IP であり、`REPLICATION SLAVE, REPLICATION CLIENT` が付与されていることを確認する |
