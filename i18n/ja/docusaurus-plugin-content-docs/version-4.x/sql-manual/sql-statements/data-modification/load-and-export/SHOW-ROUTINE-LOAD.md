---
{
    "title": "SHOW ROUTINE LOAD",
    "language": "ja",
    "description": "このステートメントは、Routine Load ジョブの実行状態を表示します。特定のジョブ、またはすべてのジョブの状態情報を確認できます。"
}
---

## 説明

このステートメントは、Routine Load ジョブの実行状態を表示します。特定のジョブ、またはすべてのジョブの状態情報を確認できます。

## 構文

```sql
SHOW [ALL] ROUTINE LOAD [FOR <jobName>];
```

## オプションパラメータ

**1. `[ALL]`**

> 省略可能です。指定すると、停止またはキャンセルされたジョブを含むすべてのジョブが表示されます。指定しない場合は、現在実行中のジョブのみが表示されます。

**2. `[FOR <jobName>]`**

> 省略可能です。表示するジョブの名前を指定します。指定しない場合は、現在のデータベース内のすべてのジョブが表示されます。
>
> 次の形式を使用できます。
>
> - `<job_name>`: 現在のデータベース内で指定した名前のジョブを表示します。
> - `<db_name>.<job_name>`: 指定したデータベース内で指定した名前のジョブを表示します。

## 戻り値

| フィールド名 | 説明 |
| :--- | :--- |
| Id | ジョブ ID |
| Name | ジョブ名 |
| CreateTime | ジョブの作成時刻 |
| PauseTime | ジョブが最後に一時停止した時刻 |
| EndTime | ジョブの終了時刻 |
| DbName | 対応するデータベース名 |
| TableName | 対応するテーブル名。複数のテーブルを対象とする場合は 'multi-table' と表示されます。 |
| IsMultiTable | 複数テーブルを対象とするジョブかどうか |
| State | ジョブの実行状態 |
| DataSourceType | データソースの種類: KAFKA |
| CurrentTaskNum | 現在のサブタスク数 |
| JobProperties | ジョブの設定の詳細 |
| DataSourceProperties | データソースの設定の詳細 |
| CustomProperties | カスタム設定。機密プロパティは `******` と表示されます。詳細は以下の「機密プロパティのマスキング」を参照してください。 |
| Statistic | ジョブの実行統計 |
| Progress | ジョブの実行進捗 |
| Lag | ジョブの遅延状態 |
| ReasonOfStateChanged | ジョブの状態が変わった理由 |
| ErrorLogUrls | 品質チェックに失敗し、除外されたデータを確認するための URL |
| OtherMsg | その他のエラーメッセージ |
| User | ジョブを作成したユーザー |
| Comment | ジョブのコメント |
| ComputeGroup | ジョブが実行されるコンピュートグループ |
| FirstErrorMsg | ジョブで最初に発生したエラーメッセージ。4.0.8（4.0 系）および 4.1.4（4.1 系）で追加されました。値は FE のメモリに保持されるため、FE を再起動すると失われます。エラー統計がリセットされると、`ErrorLogUrls` も消去されます。 |

### 機密プロパティのマスキング

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Protecting Kafka credentials / Audit compliance -->

:::caution 動作の変更（4.0.8）

バージョン 4.0.8 以降、Kafka Routine Load ジョブの機密プロパティは、平文ではなく `******` として `CustomProperties` に表示されます。`SHOW CREATE ROUTINE LOAD` の出力も同様にマスキングされます。

:::

以下のプロパティが機密情報として認識され、マスキングされます。

| 一致条件 | 例 |
| --- | --- |
| プロパティ名が `sasl.jaas.config` | `sasl.jaas.config` |
| プロパティ名が `aws.access_key` | `aws.access_key` |
| プロパティ名が `ssl.keystore.key` または `ssl.key.pem` | `ssl.keystore.key` |
| `.password`、`.secret`、`.secret_key`、`.secret.key` のいずれかで終わる | `ssl.keystore.password`、`sasl.oauthbearer.client.secret` |
| `.session_key` または `.session.token` で終わる | `aws.session.token` |
| `.private.key`、`.private_key`、`.passphrase` のいずれかで終わるか、`.private.key.` を含む | `sasl.oauthbearer.assertion.private.key.pem` |

マスキングは値の表示方法にのみ影響し、ジョブが実際に使用するプロパティ値は変わりません。これらのプロパティを変更するには、[ALTER ROUTINE LOAD](./ALTER-ROUTINE-LOAD) で値を再設定してください。元の値を `SHOW` の結果から読み取ることはできません。

### FirstErrorMsg と OtherMsg

- `FirstErrorMsg`: ジョブの実行中に発生した**最初の**エラーです。根本原因の特定に役立ちます。ジョブの実行が長く続いた場合、後続のエラーは最初のエラーから派生したものであることがよくあります。
- `OtherMsg`: 直近のその他のエラーメッセージです。後続のエラーが発生すると上書きされます。

:::info 注記

これらの値は [`information_schema.routine_load_job`](../../../../admin-manual/system-tables/information_schema/routine_load_job) からも照会できます。バージョン 4.0.8 以降、このテーブルは master FE が提供するため、クエリが master 以外の FE に送られた場合も `FIRST_ERROR_MSG` と `ERROR_LOG_URLS` は空になりません。

:::

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :--- | :--- | :--- |
| LOAD_PRIV | テーブル | SHOW ROUTINE LOAD には、テーブルに対する LOAD 権限が必要です。 |

## 注意事項

- 状態の説明:
  - NEED_SCHEDULE: ジョブはスケジュール待ちです。
  - RUNNING: ジョブは実行中です。
  - PAUSED: ジョブは一時停止中です。
  - STOPPED: ジョブは終了しました。
  - CANCELLED: ジョブはキャンセルされました。

- 進捗の説明:
  - Kafka データソースの場合、各パーティションの消費済みオフセットを表示します。
  - たとえば、{"0":"2"} は Kafka パーティション 0 の消費進捗が 2 であることを示します。

- 遅延の説明:
  - Kafka データソースの場合、各パーティションの消費遅延を表示します。
  - たとえば、{"0":10} は Kafka パーティション 0 の消費ラグが 10 であることを示します。

## 例

- test1 という名前の Routine Load ジョブを、停止またはキャンセルされたものも含めてすべて表示します。

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```

- test1 という名前で現在実行中の Routine Load ジョブを表示します。

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```

- example_db 内の Routine Load ジョブを、停止またはキャンセルされたものも含めてすべて表示します。結果は単一行または複数行になる場合があります。

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```

- example_db 内で現在実行中の Routine Load ジョブをすべて表示します。

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```

- example_db 内で test1 という名前の現在実行中の Routine Load ジョブを表示します。

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```

- example_db 内で test1 という名前の Routine Load ジョブを、停止またはキャンセルされたものも含めてすべて表示します。結果は単一行または複数行になる場合があります。

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```