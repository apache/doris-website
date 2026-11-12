---
{
    "title": "Meta Service の設定項目",
    "language": "ja",
    "description": "コンピュートとストレージを分離したモードにおける Meta Service の設定項目の型、デフォルト値、実行時の変更可否、および効果。"
}
---

このページでは、4.1.5 で追加された Meta Service の設定項目を紹介します。すべての設定項目はまだ網羅していません。Meta Service は `doris_cloud.conf` を使用します。これらの設定項目は FE の `fe.conf` や BE の `be.conf` には指定しません。

## トランザクション管理 {#transaction-management}

### `enable_get_prepare_txn_by_coordinator_by_running_key` {#enable_get_prepare_txn_by_coordinator_by_running_key}

| 項目 | 値 |
| --- | --- |
| 型 | Boolean |
| デフォルト値 | `true` |
| 実行時に変更可能 | はい |
| バージョン | 4.1.5 で追加 |

Meta Service が coordinator に属する準備済みトランザクションを検索する際のスキャン方法を制御します。デフォルトでは、まず実行中トランザクションのインデックスをスキャンし、対応するトランザクション情報を取得します。これにより、すべてのトランザクションレコードをスキャンせずに済みます。`false` に設定すると、トランザクション情報のレコードを直接スキャンします。どちらの方法もトランザクションの選択条件は同じで、同じ結果を返します。スキャン方法を変更する必要がなければ、デフォルト値を維持してください。

この項目を明示的に設定するには、Meta Service の `doris_cloud.conf` に以下を追加します。

```properties
enable_get_prepare_txn_by_coordinator_by_running_key = true
```
