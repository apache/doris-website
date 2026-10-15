---
{
    "title": "DROP WORKLOAD GROUP",
    "language": "ja",
    "description": "このステートメントはワークロードグループを削除します。"
}
---

## 説明

このステートメントはワークロードグループを削除します。

## 構文

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>' [FOR <compute_group>]
```

## パラメータ

1. `<compute_group>`

    削除対象のワークロードグループが属するコンピュートグループを指定します。

    - **クラウドモード（ストレージとコンピュートを分離）**: `FOR <compute_group>` 句を**明示的に指定する必要があります**。省略すると、`Must specify compute group via 'FOR <compute_group>' in cloud mode.` というエラーが発生します。
    - **非クラウドモード（ストレージとコンピュートを結合）**: `FOR <compute_group>` 句は省略可能です。ここで指定する値は実際にはリソースグループ（Tag）を指します。構文がクラウドモードと共通なのは、表記を統一するためです。省略すると、デフォルトのリソースグループ（`default`）に属する同名のワークロードグループが削除されます。

## 例

1. g1 という名前のワークロードグループを削除します（非クラウドモードでは、デフォルトのリソースグループから g1 を削除します）。

    ```sql
    drop workload group if exists g1;
    ```

2. `compute_group_a` から g1 という名前のワークロードグループを削除します（クラウドモードではこの句が必須です）。

    ```sql
    drop workload group if exists g1 for compute_group_a;
    ```
