---
{
  "title": "CREATE WORKLOAD POLICY を作成",
  "language": "ja",
  "description": "特定の条件を満たすクエリに対して対応するアクションを実行するためのWorkload Policyを作成します。"
}
---
## 説明

特定の条件を満たすクエリに対して対応するアクションを実行するWorkload Policyを作成します。


## 構文

```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```
### 必須パラメータ

`<workload_policy_name>`

Workload Policyの名前。



1. **be_scan_rows**: 単一のBEプロセス内でSQLクエリによってスキャンされた行数。SQLクエリが複数のBE上で並行して実行される場合、これらの並行実行の累積値となります。
2. **be_scan_bytes**: 単一のBEプロセス内でSQLクエリによってスキャンされたバイト数。SQLクエリが複数のBE上で並行して実行される場合、これらの並行実行の累積値となります（バイト単位）。
3. **query_time**: 単一のBEプロセス上でのSQLクエリの実行時間（ミリ秒単位）。
4. **query_be_memory_bytes**（バージョン2.1.5からサポート）: 単一のBEプロセス内でSQLクエリによって使用されるメモリ量。SQLクエリが複数のBE上で並行して実行される場合、これらの並行実行の累積値となります（バイト単位）。


`<actions>`

1. **set_session_variable**: このアクションはset session variable文を実行します。同一ポリシー内で複数の**set_session_variable**アクションを指定でき、1つのポリシー内で複数のセッション変数変更文を実行することができます。
2. **cancel_query**: クエリをキャンセルします。

### オプションパラメータ



1. **enabled**: trueまたはfalseの値を取り、デフォルト値はtrueです。trueに設定するとポリシーが有効になり、falseに設定するとポリシーが無効になります。
2. **priority**: 0から100の範囲の整数値で、デフォルト値は0です。これはポリシーの優先度を表します。値が高いほど優先度が高くなります。複数のポリシーがマッチした場合、最も優先度の高いポリシーが選択されます。
3. **workload_group**: 現在、ポリシーは1つのworkload groupにバインドでき、このポリシーが特定のworkload groupにのみ適用されることを示します。デフォルトは空で、すべてのクエリに適用されることを意味します。

### アクセス制御要件

最低でも`ADMIN_PRIV`権限が必要です。

## 例

1. クエリ時間が3秒を超えるすべてのクエリをkillする新しいWorkload Policyを作成します。

  ```Java
  create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
  ```
1. デフォルトで有効にならない新しいWorkload Policyを作成します。

  ```Java
  create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
  ```
