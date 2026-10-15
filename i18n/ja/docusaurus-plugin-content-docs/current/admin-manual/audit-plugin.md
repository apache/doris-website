---
{
    "title": "監査ログ",
    "language": "ja",
    "description": "Doris はデータベース操作の監査機能を提供し、ユーザーのログイン、クエリ、変更操作を記録できます。"
}
---

Doris はデータベース操作の監査機能を提供し、ユーザーのログイン、クエリ、データベースの変更操作を記録できます。Doris では、組み込みのシステムテーブルを直接クエリするか、Doris の監査ログファイルを参照することで監査ログを確認できます。

## 監査ログの有効化

Doris にはバージョン 2.1.0 から監査ログプラグインが組み込まれており、別途インストールする必要はありません。グローバル変数 `enable_audit_plugin` は、監査ログを `__internal_schema.audit_log` に書き込むかどうかを制御します。デフォルト値は Doris のバージョンによって異なります。

| Doris のバージョン | `enable_audit_plugin` のデフォルト値 |
| --- | --- |
| 2.1.x、3.0.x、3.1.0、3.1.1 | `false`（無効） |
| 3.1.2 以降の 3.1.x リリース | `true`（有効） |
| 4.0.0 以降のリリース | `true`（有効） |

監査ログプラグインは、3.1.2 以降の 3.1.x リリースではデフォルトで有効です。4.0.0 以降のリリースでもデフォルトで有効です。これらのバージョンでは、`enable_audit_plugin` のデフォルト値は `true` です。

クラスターの現在の値を確認します。

```sql
SHOW GLOBAL VARIABLES LIKE 'enable_audit_plugin';
```

値が `false` の場合は、いつでも有効にできます。

```sql
SET GLOBAL enable_audit_plugin = true;
```

有効にすると、それ以降の監査ログが `__internal_schema.audit_log` に書き込まれます。

監査ログテーブルへの書き込みを無効にするには、次を実行します。

```sql
SET GLOBAL enable_audit_plugin = false;
```

プラグインを無効にすると、`__internal_schema.audit_log` への新しい書き込みは停止しますが、既存のレコードは保持されます。この変数は、後述する `fe.audit.log` ファイルには影響しません。

## 監査ログテーブルの確認

:::caution 注意

バージョン 2.1.8 より前では、システムのバージョンアップに伴って監査ログテーブルのフィールドが増える場合があります。アップグレード後は、`audit_log` テーブルに、監査ログテーブルのフィールドに応じて `ALTER TABLE` コマンドでフィールドを追加する必要があります。

:::

Doris バージョン 2.1 以降では、監査ログ機能を有効にすると、ユーザーの操作を [`audit_log`](../admin-manual/system-tables/internal_schema/audit_log) テーブルに書き込めます。このテーブルは `__internal_schema` データベースにあります。

監査ログテーブルは動的パーティションテーブルです。デフォルトでは日単位でパーティション分割され、直近 30 日分のデータが保持されます。動的パーティションの保持期間は、`dynamic_partition.start` プロパティを `ALTER TABLE` ステートメントで変更すると調整できます。

## 監査ログファイル

`fe.conf` の `LOG_DIR` で FE ログの保存先を指定します。この FE ノードで実行されたすべてのデータベース操作は `${LOG_DIR}/fe.audit.log` に記録されます。クラスター全体の操作を確認するには、各 FE ノードの監査ログを調べる必要があります。

## 監査ログの形式

バージョン 3.0.7 より前では、ステートメント内の `\n`、`\t`、`\r` は、それぞれ `\\n`、`\\t`、`\\r` に置き換えられていました。変換後のステートメントが `fe.audit.log` ファイルと `audit_log` テーブルに保存されていました。

バージョン 3.0.7 以降、`fe.audit.log` ファイルでは、ステートメント内の `\n` のみが `\\n` に置き換えられます。`audit_log` テーブルには、元の形式のステートメントが保存されます。

## 監査ログの設定

**グローバル変数：**

監査ログの変数は、`set [global] <var_name> = <var_value>` で変更できます。

| 変数 | デフォルト値 | 説明 |
| --- | --- | --- |
| `audit_plugin_max_batch_interval_sec` | 60 秒 | 監査ログテーブルへの書き込み間隔の最大値。 |
| `audit_plugin_max_batch_bytes` | 50MB | 監査ログテーブルに書き込むバッチあたりのデータ量の最大値。 |
| `audit_plugin_max_sql_length` | 4096 | 監査ログテーブルに記録する SQL ステートメントの最大長。 |
| `audit_plugin_load_timeout` | 600 秒 | 監査ログのインポートジョブのデフォルトのタイムアウト。 |
| `audit_plugin_max_insert_stmt_length` | Int.MAX | `INSERT` ステートメントの最大長。`audit_plugin_max_sql_length` より大きい場合は、`audit_plugin_max_sql_length` の値が使用されます。このパラメータはバージョン 3.0.6 以降でサポートされます。 |

一部の `INSERT INTO VALUES` ステートメントは非常に長く、頻繁に送信されると監査ログが肥大化する場合があります。そのため、Doris では `audit_plugin_max_insert_stmt_length` をバージョン 3.0.6 で追加し、`INSERT` ステートメントの監査時に記録する長さを個別に制限できるようにしました。これにより監査ログの肥大化を防ぎ、SQL ステートメントを漏れなく監査できるようにします。

**FE の設定項目：**

FE の設定項目は `fe.conf` を編集して変更できます。

| 設定項目 | 説明 |
| --- | --- |
| `skip_audit_user_list` | 特定のユーザーの操作を監査ログに記録しない場合は、この設定を変更できます（バージョン 3.0.01 以降でサポート）。たとえば、`user1` と `user2` を監査ログの記録対象から除外するには、`skip_audit_user_list=user1,user2` を設定します。 |
