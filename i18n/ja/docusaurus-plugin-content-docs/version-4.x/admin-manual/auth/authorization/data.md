---
{
    "title": "データアクセス制御",
    "language": "ja",
    "description": "Apache Doris では、行ポリシー、列権限、データマスキングを使用して機密データへのきめ細かなアクセス制御を実現できます。ユーザーやロールごとに閲覧できる行、列、フィールドの内容を制限します。",
    "keywords": [
        "データアクセス制御",
        "行ポリシー",
        "Row Policy",
        "列権限",
        "Column Permission",
        "データマスキング",
        "Data Masking",
        "機密データ保護",
        "Select_priv",
        "Apache Ranger",
        "きめ細かな権限",
        "RBAC"
    ]
}
---

<!-- Knowledge type: Feature introduction / Procedure -->
<!-- Applicable scenarios: Sensitive data protection / Data compliance / Fine-grained permission control -->

Apache Doris には、**行ポリシー**、**列権限**、**データマスキング**の三つの仕組みがあります。管理者はこれらを使用して、行、列、フィールドの内容に対するきめ細かなアクセス制御を機密データに適用できます。このドキュメントでは、各仕組みの動作、制限事項、一般的な例を説明します。

## 適用シナリオ

| シナリオ | 推奨する仕組み | 説明 |
|------|----------|------|
| ユーザーごとにテーブルの**一部の行**のみを表示する（地域、テナント、部門ごとの分離など） | 行ポリシー | クエリにフィルター条件を自動的に追加します |
| ユーザーごとにテーブルの**一部の列**のみにアクセスを許可する（給与や電話番号の列を隠す場合など） | 列権限 | 指定した列に対してのみ `Select_priv` を付与します |
| 機密フィールドを**部分的に隠す、または置換する**（身分証明書番号や銀行カード番号を `***` と表示する場合など） | データマスキング | Apache Ranger でマスキングポリシーを設定します |

## 前提条件

- 現在のユーザーが、対象オブジェクトに対する管理権限（`GRANT` 権限など）を持っていること。
- データマスキングには Apache Ranger が必要です。事前に Ranger との連携を完了してください（[Apache Ranger による認可](./ranger)を参照）。
- 三つの仕組みはいずれも、デフォルトユーザーの `root` と `admin` には適用されません。

## 行ポリシー

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Multi-tenant isolation / Row-level data filtering -->

Doris の行ポリシーを使用すると、機密データに対してきめ細かなアクセス制御を適用できます。テーブルレベルで定義したセキュリティポリシーに基づき、テーブル内の特定のレコードにアクセスできるユーザーやロールを指定できます。

### 動作の仕組み

行ポリシーが設定されたユーザーのクエリには、Doris が行ポリシーで定義された条件式を自動的に追加します。

### 制限事項

- デフォルトユーザーの `root` と `admin` には行ポリシーを設定できません。

### 関連コマンド

- 行ポリシーの表示：[SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY)
- 行ポリシーの作成：[CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY)

### 行ポリシーの例

1. ユーザー `test` が `table1` で `c1='a'` の行のみをクエリできるように制限します。

    ```sql
    CREATE ROW POLICY test_row_policy_1 ON test.table1 
    AS RESTRICTIVE TO test USING (c1 = 'a');
    ```

## 列権限

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Column-level data isolation / Sensitive field hiding -->

Doris の列権限を使用すると、テーブルに対してきめ細かなアクセス制御を適用できます。テーブル内の特定の列にのみ権限を付与し、その列にアクセスできるユーザーやロールを指定できます。

現在、列権限でサポートされるのは `Select_priv` のみです。

### 関連コマンド

- 付与：[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- 取り消し：[REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)

### 列権限の例

1. `user1` に、列 `col1` と `col2` をテーブル `tbl` からクエリする権限を付与します。

    ```sql
    GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
    ```

## データマスキング

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Sensitive field protection / Data compliance -->

データマスキングは、機密データを保護する方法です。元のデータを変更、置換、または隠すことで、マスキング後のデータに一定の形式や特性を保ちながら、機密情報を含まないようにします。

例えば、管理者はクレジットカード番号や身分証明書番号などの機密フィールドの数字の一部または全部をアスタリスク `*` などの文字に置き換えたり、実名を仮名に置き換えたりできます。

バージョン 2.1.2 以降、Doris は Apache Ranger Data Masking による列へのマスキングポリシーの設定をサポートしています。現在、設定方法は [Apache Ranger](./ranger) を使用する方法のみです。

> データマスキングは `admin` または `root` ユーザーには適用されません。

## FAQ

### Q: `root` または `admin` ユーザーに行ポリシーやデータマスキングを設定しましたが、適用されません。

三つの仕組みはいずれも、デフォルトのスーパーユーザーである `root` と `admin` には適用されません。通常の業務ユーザーを使用して確認してください。

### Q: 列権限を付与した後も、クエリで権限不足が報告されます。

現在、列権限でサポートされるのは `Select_priv` のみです。権限付与のステートメントでこの権限を使用していること、および権限付与の対象が意図した Catalog、データベース、またはテーブルであることを確認してください。

### Q: データマスキングポリシーが適用されません。

データマスキングは Apache Ranger で設定する必要があり、Doris バージョン 2.1.2 以降が必要です。Ranger との連携が完了し、ポリシーが有効で、現在のユーザーが `root` または `admin` ではないことを確認してください。
