---
{
    "title": "CREATE WORKLOAD POLICY",
    "language": "ja",
    "description": "Workload Policyを作成します。クエリが特定の条件を満たした場合に、対応するアクションを実行するために使用します。"
}
---

## 説明

Workload Policyを作成します。クエリが特定の条件を満たした場合に、対応するアクションを実行するために使用します。

## 構文

```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```

## 必須パラメータ

1. `<workload_policy_name>`：Workload Policyの名前です。

2. `<conditions>`
    - be_scan_rows：1つのBEプロセス内でSQLがスキャンした行数です。SQLがBE上で複数の並行処理によって実行される場合は、各並行処理の累積値です。
    - be_scan_bytes：1つのBEプロセス内でSQLがスキャンしたバイト数です。SQLがBE上で複数の並行処理によって実行される場合は、各並行処理の累積値です。単位はバイトです。
    - query_time：単一のBEプロセス上でのSQLの実行時間です。単位はミリ秒です。
    - query_be_memory_bytes：バージョン2.1.5以降でサポートされています。1つのBEプロセス内でSQLが使用するメモリ量です。SQLがBE上で複数の並行処理によって実行される場合は、各並行処理の累積値です。単位はバイトです。

3. `<actions>`
    - cancel_query：クエリをキャンセルします。

## オプションパラメータ

1. `<properties>`
    - enabled：trueまたはfalseを指定できます。デフォルトはtrueです。trueの場合はポリシーが有効になり、falseの場合は無効になります。
    - priority：0から100までの整数を指定できます。デフォルトは0です。値が大きいほど優先度が高くなります。複数のポリシーがクエリに一致した場合は、優先度が最も高いポリシーが選択されます。
    - workload_group：ポリシーを1つのWorkload Groupにバインドできます。バインドした場合、そのポリシーは該当するWorkload Groupに対してのみ有効になります。デフォルトは空で、すべてのクエリに適用されます。

        Workload Group自体がCompute Groupに属するため、このプロパティの値は次の規則に従う必要があります。

        - **クラウド（ストレージ・コンピュート分離）モード**：完全修飾形式 `<compute_group>.<workload_group>` が必要です。例：`'workload_group'='compute_group_a.wg1'`。`<workload_group>` 単独の形式、`.` が2つ以上含まれる形式、または空のセグメント（`.wg1` や `wg1.` など）を含む形式は使用できず、次のエラーが返されます：`workload_group must be '<compute_group>.<workload_group>' in cloud mode`。
        - **非クラウド（ストレージ・コンピュート統合）モード**：次の2つの形式を使用できます。
            - `<workload_group>`：デフォルトのリソースグループ（`default`）配下にある同名のWorkload Groupにバインドされます。
            - `<resource_group>.<workload_group>`：リソースグループを明示的に指定します。ここでのプレフィックスは実際にはリソースグループ（Tag）を指します。構文は、一貫性を保つためにクラウドモードと共通化されています。

            `.` が2つ以上含まれる形式、または空のセグメントを含む形式も使用できず、次のエラーが返されます：`workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode`。

## アクセス制御要件

少なくともADMIN_PRIV権限が必要です。

## 例

1. 実行時間が3秒を超えたクエリをキャンセルするWorkload Policyを作成します。

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
    ```

2. デフォルトで無効になっているWorkload Policyを作成します。

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
    ```

3. クラウドモードで、Compute Group `compute_group_a` 配下のWorkload Group `wg1` に対してのみ有効になるポリシーを作成します（完全修飾形式を使用します）。

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('workload_group'='compute_group_a.wg1')
    ```
