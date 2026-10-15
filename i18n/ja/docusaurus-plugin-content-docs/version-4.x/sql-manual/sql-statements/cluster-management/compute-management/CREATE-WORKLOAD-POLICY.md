---
{
    "title": "CREATE WORKLOAD POLICY",
    "language": "ja",
    "description": "ワークロードポリシーを作成します。クエリが指定された条件を満たすと、対応するアクションを実行します。"
}
---

## 説明

ワークロードポリシーを作成します。クエリが指定された条件を満たすと、対応するアクションを実行します。

## 構文

```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```

## 必須パラメータ

1. `<workload_policy_name>`: ワークロードポリシーの名前。

2. `<conditions>`
    - be_scan_rows: 単一の BE プロセス内で SQL がスキャンした行数。BE 上で SQL が並列実行される場合は、各並列実行分の累積値です。
    - be_scan_bytes: 単一の BE プロセス内で SQL がスキャンしたバイト数。BE 上で SQL が並列実行される場合は、各並列実行分の累積値です。単位はバイトです。
    - query_time: 単一の BE プロセスでの SQL の実行時間。単位はミリ秒です。
    - query_be_memory_bytes: バージョン 2.1.5 以降でサポートされます。単一の BE プロセス内での SQL のメモリ使用量。BE 上で SQL が並列実行される場合は、各並列実行分の累積値です。単位はバイトです。

3. `<actions>`
    - cancel_query: クエリをキャンセルします。

## オプションパラメータ

1. `<properties>`
    - enabled: true または false を指定できます。デフォルトは true です。true の場合はポリシーが有効になり、false の場合は無効になります。
    - priority: 0 から 100 までの整数。デフォルトは 0 です。値が大きいほど優先度が高くなります。複数のポリシーがクエリに一致する場合は、優先度が最も高いポリシーが選択されます。
    - workload_group: ポリシーを一つのワークロードグループに関連付けることができます。この場合、ポリシーはそのワークロードグループに対してのみ有効です。デフォルトは空で、すべてのクエリに適用されます。

        ワークロードグループ自体はコンピュートグループに属するため、このプロパティの値には次の規則が適用されます。

        - **クラウドモード（ストレージとコンピューティングを分離）**: `<compute_group>.<workload_group>` という完全修飾形式が必要です。例: `'workload_group'='compute_group_a.wg1'`。`<workload_group>` のみの形式、複数の `.`、または空のセグメント（`.wg1` や `wg1.` など）を指定すると、`workload_group must be '<compute_group>.<workload_group>' in cloud mode` というエラーになります。
        - **非クラウドモード（ストレージとコンピューティングを結合）**: 次の二つの形式を指定できます。
            - `<workload_group>`: デフォルトのリソースグループ（`default`）にある同名のワークロードグループに関連付けます。
            - `<resource_group>.<workload_group>`: リソースグループを明示的に指定します。ここでの接頭辞は実際にはリソースグループ（Tag）を指します。この構文は一貫性のためにクラウドモードと共通になっています。
            
            同様に、複数の `.` または空のセグメントを指定すると、`workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode` というエラーになります。

## 権限要件

少なくとも ADMIN_PRIV 権限が必要です。

## 例

1. 実行時間が 3 秒を超えるクエリをキャンセルするワークロードポリシーを作成します。

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
    ```

2. 作成時に無効となるワークロードポリシーを作成します。

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
    ```

3. クラウドモードで、ワークロードグループ `wg1`（コンピュートグループ `compute_group_a` に所属）に対してのみ有効なポリシーを作成します（完全修飾形式を使用します）。

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('workload_group'='compute_group_a.wg1')
    ```
