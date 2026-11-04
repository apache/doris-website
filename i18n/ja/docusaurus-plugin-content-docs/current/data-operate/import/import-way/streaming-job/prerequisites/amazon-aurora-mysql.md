---
{
    "title": "Amazon Aurora MySQL",
    "language": "ja",
    "description": "Doris ストリーミング取り込みをサポートするために、Amazon Aurora MySQL で Binlog を有効化し、同期ユーザーを構成するための前提手順。",
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

:::caution 実験的機能

Doris の継続ロードは実験的機能で、Doris 4.1.5 以降でサポートされます。

:::

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Data source onboarding prerequisite configuration -->

Doris ストリーミング取り込みは、Amazon Aurora MySQL-Compatible Edition の **5.6、5.7、8.0.x** バージョンをサポートします。Aurora MySQL ではデフォルトで Binlog が有効になっていないため、データを同期する前に Aurora クラスター上で Binlog の有効化と構成、同期ユーザーの作成、Binlog 保持期間の設定などの前提作業を完了する必要があります。

このドキュメントは、Aurora MySQL のデータを Doris ストリーミング取り込みに取り込む予定のユーザーを対象とし、エンドツーエンドの構成ワークフローを提供します。

### 前提条件チェックリスト {#prerequisite-checklist}

Doris への接続を開始する前に、Aurora クラスターが次の条件を満たしていることを確認してください。

| 確認項目 | 期待値 | 確認方法 |
| :--- | :--- | :--- |
| Binlog が有効かどうか | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog 形式 | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog 行イメージ | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| 同期ユーザー | 専用アカウントが存在し、レプリケーション権限を持っている | `SHOW GRANTS FOR ...;` を実行 |
| Binlog 保持期間 | 少なくとも 72 時間 | `CALL mysql.rds_show_configuration;` |

すべての条件を満たしていれば、Doris 側のストリーミング取り込み構成に直接進めます。いずれかの項目を満たしていない場合は、以下の手順に従って構成してください。

## ステップ 1: 現在の Binlog 構成を確認する {#step-1-check-the-current-binlog-configuration}

**Aurora 書き込みインスタンス**に接続し、次の SQL を実行して Binlog の状態を確認します。

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

結果に基づいて、次の手順を選択します。

- 三つの条件（`log_bin = ON`、`binlog_format = ROW`、`binlog_row_image = FULL`）をすべて満たす場合は、**次の手順へ直接進めます：** [ステップ 4: 同期ユーザーを作成する](#step-4-create-a-sync-user)。
- それ以外の場合は、[ステップ 2](#step-2-configure-the-cluster-parameter-group) に進み、クラスターパラメータグループを介して Binlog を有効にします。

## ステップ 2: クラスターパラメータグループを構成する {#step-2-configure-the-cluster-parameter-group}

Aurora MySQL ではランタイムパラメータを直接変更できないため、**DB Cluster Parameter Group** を介して変更する必要があります。

手順：

1. [AWS RDS コンソール](https://console.aws.amazon.com/rds/)にログインします。
2. 左側のナビゲーションペインで **Parameter groups** を選択し、**Create parameter group** をクリックします。
3. タイプとして **DB Cluster Parameter Group** を選択し、対象クラスターに一致する Aurora MySQL のバージョンファミリーを選択します。
4. 新しく作成したクラスターパラメータグループを編集し、`binlog_format` を検索して、値を `ROW` に設定します。

    ![MySQL Binlog フォーマット設定](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. `binlog_row_image` を検索し、値を `FULL` に設定します。
6. **Save Changes** をクリックして保存します。

変更が必要な主なパラメータの概要は次のとおりです。

| パラメータ | 推奨値 | 説明 |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | CDC 同期には行レベルのロギングが必要です |
| `binlog_row_image` | `FULL` | Binlog にすべての列の完全なイメージが含まれるようにします |

## ステップ 3: クラスターパラメータグループを適用して再起動する {#step-3-apply-the-cluster-parameter-group-and-restart}

新しく作成したパラメータグループを対象クラスターにバインドし、変更を有効にする前に書き込みインスタンスを再起動する必要があります。

1. RDS コンソールで対象の Aurora クラスターを選択し、**Modify** をクリックします。
2. **DB cluster parameter group** で、[ステップ 2](#step-2-configure-the-cluster-parameter-group) で作成したクラスターパラメータグループを選択します。
3. **Apply immediately** にチェックを入れて、変更を直ちに適用します。
4. Aurora の **書き込みインスタンス**を再起動して、構成を有効にします。

:::caution
`binlog_format` パラメータの変更を有効にするには、Aurora の書き込みインスタンスを再起動する必要があります。この操作は業務の閑散時間帯に行ってください。
:::

再起動後、[ステップ 1](#step-1-check-the-current-binlog-configuration) の SQL をもう一度実行して確認します。三つのパラメータがすべて期待値と一致している必要があります。

## ステップ 4: 同期ユーザーを作成する {#step-4-create-a-sync-user}

権限管理と監査を容易にするため、Doris ストリーミング取り込み専用のアカウントを作成します。

1. ユーザーを作成します。

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. 同期に必要な権限を付与します。

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

必要な権限の説明：

| 権限 | 用途 |
| :--- | :--- |
| `SELECT` | 全量ロードフェーズで業務テーブルのデータを読み取る |
| `REPLICATION SLAVE` | レプリケーションクライアントとして Binlog ストリームを読み取る |
| `REPLICATION CLIENT` | Binlog ファイルの位置情報などのメタデータを照会する |

## ステップ 5: Binlog 保持期間を構成する {#step-5-configure-the-binlog-retention-period}

Aurora はデフォルトで Binlog を比較的早く回収するため、障害発生後にレプリケーションを再開できなくなる可能性があります。障害時にもバイナリログを利用できるよう、Binlog 保持期間を **少なくとも 72 時間** に設定することを推奨します。

`mysql.rds_set_configuration` ストアドプロシージャを使用して設定します。

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

次の SQL を使用して現在の構成を確認できます。

```sql
CALL mysql.rds_show_configuration;
```

:::caution
この構成項目を設定しない、または間隔を短く設定しすぎると、バイナリログに欠落が生じ、Doris がレプリケーションを再開できなくなる可能性があります。
:::

## よくある質問 {#faq}

**Q1: `binlog_format` を変更した後も値が `ROW` にならないのはなぜですか？**

A: Aurora MySQL ではランタイムパラメータを直接変更できません。[ステップ 2](#step-2-configure-the-cluster-parameter-group) の説明に従って **DB Cluster Parameter Group** を作成してバインドし、その後 **書き込みインスタンス**を再起動して変更を有効にする必要があります。デフォルトのパラメータグループを変更しても機能しません。

**Q2: 確認と構成は書き込みインスタンスで行う必要がありますか？**

A: はい。Binlog は Aurora の書き込みインスタンスでのみ生成されるため、すべての SQL 確認と同期ユーザーの作成は書き込みインスタンスで行う必要があります。

**Q3: `binlog retention hours` を高く設定しすぎると、どのような影響がありますか？**

A: より多くのストレージ容量を消費します。実際の障害復旧時間枠に基づいてこの値を設定し、最低でも 72 時間にすることを推奨します。

## トラブルシューティング {#troubleshooting}

| 症状 | 考えられる原因 | 解決策 |
| :--- | :--- | :--- |
| `log_bin` がまだ `OFF` | カスタムクラスターパラメータグループがバインドされていない、または書き込みインスタンスが再起動されていない | [ステップ 3](#step-3-apply-the-cluster-parameter-group-and-restart) に従ってパラメータグループをバインドし、書き込みインスタンスを再起動します |
| `binlog_format` が `ROW` ではない | インスタンスパラメータグループを変更し、クラスターパラメータグループを変更していない | **DB Cluster Parameter Group** で `binlog_format = ROW` に設定します |
| Doris の同期で Binlog ファイルが見つからないというエラーが報告される | `binlog retention hours` が小さすぎ、Binlog が回収された | `mysql.rds_set_configuration` を使用して保持期間を少なくとも 72 時間に延長します |
| 同期ユーザーの認証に失敗する | ユーザーのホスト制限または権限不足 | ユーザーのホストが `'%'` または Doris BE のエグレス IP であり、`REPLICATION SLAVE, REPLICATION CLIENT` が付与されていることを確認します |
