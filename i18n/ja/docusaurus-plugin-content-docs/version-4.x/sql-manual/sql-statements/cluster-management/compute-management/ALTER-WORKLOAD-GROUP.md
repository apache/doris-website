---
{
    "title": "ALTER WORKLOAD GROUP",
    "language": "ja",
    "description": "このステートメントはワークロードグループの設定を変更します。"
}
---

## 説明

このステートメントはワークロードグループの設定を変更します。

## 構文

```sql
ALTER WORKLOAD GROUP  "<rg_name>"
[FOR <compute_group>]
PROPERTIES (
  `<property>`
  [ , ... ]
);
```

:::note
`ALTER` ステートメントで変更できるのはワークロードグループのプロパティのみです。**ワークロードグループとコンピュートグループの紐付けは変更できません**。`FOR <compute_group>` 句は、変更対象のワークロードグループが属するコンピュートグループを特定するために使用します。
:::

## パラメータ

1. `<compute_group>`

    変更対象のワークロードグループが属するコンピュートグループを指定します。

    - **クラウドモード（ストレージとコンピュートを分離）**: `FOR <compute_group>` 句を**明示的に指定する必要があります**。省略すると、`Must specify compute group via 'FOR <compute_group>' in cloud mode.` というエラーが発生します。
    - **非クラウドモード（ストレージとコンピュートを一体化）**: `FOR <compute_group>` 句は省略できます。ここで指定する値は、実際にはリソースグループ（Tag）を指します。構文の一貫性を保つため、クラウドモードと同じ構文を使用します。省略した場合は、デフォルトのリソースグループ（`default`）に属する同名のワークロードグループが対象になります。

2. `<property>`

    `<property>` の形式は `<key>` = `<value>` です。`<key>` に指定できる値については、[ワークロードグループ](../../../../admin-manual/workload-management/workload-group.md)を参照してください。

## 例

1. g1 という名前のワークロードグループを変更します（非クラウドモードでは、デフォルトのリソースグループに属する g1 が対象です）。

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```

2. `compute_group_a` に属する g1 という名前のワークロードグループを変更します（クラウドモードでは、この句の指定が必須です）。

    ```sql
    alter workload group g1 for compute_group_a
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```
