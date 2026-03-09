---
{
  "title": "データアクセス制御",
  "language": "ja",
  "description": "Dorisの行レベルポリシーにより、機密データに対するきめ細かいアクセス制御を実現できます。"
}
---
## Row Permissions

Dorisの行レベルポリシーにより、機密データに対してきめ細かなアクセス制御を実現できます。テーブルレベルで定義されたセキュリティポリシーに基づいて、どのユーザーまたはロールがテーブル内の特定のレコードにアクセスできるかを決定できます。

### メカニズム

Row Policyが設定されたユーザーがクエリを実行する際に、Row Policyで設定された述語を自動的に追加することと同等です。

### 制限事項

デフォルトユーザーのrootとadminにはRow Policyを設定できません。

### 関連コマンド
- Row Permission Policiesの表示 [SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY.md)
- Row Permission Policyの作成 [CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY.md)

### Row Permission例
1. testユーザーがtable1でc1='a'のデータのみクエリできるように制限する

```sql
CREATE ROW POLICY test_row_policy_1 ON test.table1 
AS RESTRICTIVE TO test USING (c1 = 'a');
```
## Column Permissions
Dorisのカラム権限機能により、テーブルに対する細かい粒度のアクセス制御を実現できます。テーブル内の特定のカラムに権限を付与して、どのユーザーまたはロールがテーブル内の特定のカラムにアクセスできるかを決定できます。

現在、カラム権限はSelect_privのみをサポートしています。

### 関連コマンド
- Grant: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- Revoke: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)

### カラム権限の例

1. user1にテーブルtblのカラムcol1とcol2をクエリする権限を付与します。

```sql
GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
```
## Data Masking
Data maskingは、元のデータを変更、置換、または隠すことで機密データを保護する手法で、マスクされたデータが機密情報を含まなくなる一方で、特定の形式や特性を維持します。

例えば、管理者はクレジットカード番号やID番号などの機密フィールドの一部またはすべての数字をアスタリスク*や他の文字に置き換えたり、実名を仮名に置き換えたりすることができます。

バージョン2.1.2以降、Apache RangerのData Maskingを通じてdata maskingがサポートされ、特定のカラムにマスキングポリシーを設定できます。現在は[Apache Ranger](./ranger.md)を通じてのみ利用可能です。

> admin/rootユーザーのData Masking設定は有効になりません。
