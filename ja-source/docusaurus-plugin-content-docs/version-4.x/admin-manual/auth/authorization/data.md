---
{
  "title": "データアクセス制御",
  "language": "ja",
  "description": "Dorisの行レベルポリシーを使用することで、機密データに対する細粒度のアクセス制御を実現できます。"
}
---
## Row 許可

DorisのRow-level policiesを使用することで、機密データに対してきめ細かいアクセス制御を実現できます。テーブルレベルで定義されたセキュリティポリシーに基づいて、どのユーザーまたはロールがテーブル内の特定のレコードにアクセスできるかを決定できます。

### メカニズム

Row Policyが設定されたユーザーがクエリを実行する際に、Row Policy内で設定された述語を自動的に追加することと同等です。

### 制限事項

デフォルトユーザーのrootとadminにはRow Policyを設定できません。

### 関連コマンド
- Row 権限ポリシーの表示 [SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY)
- Row Permission Policyの作成 [CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY)

### Row Permissionの例
1. testユーザーがtable1でc1='a'のデータのみクエリできるよう制限する

```sql
CREATE ROW POLICY test_row_policy_1 ON test.table1 
AS RESTRICTIVE TO test USING (c1 = 'a');
```
## カラム権限
Dorisのカラム権限により、テーブルに対してきめ細かいアクセス制御を実現できます。テーブル内の特定のカラムに権限を付与することで、どのユーザーまたはロールがテーブル内の特定のカラムにアクセスできるかを決定できます。

現在、カラム権限はSelect_privのみをサポートしています。

### 関連コマンド
- Grant: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- Revoke: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)

### カラム権限の例

1. user1にテーブルtblのカラムcol1とcol2をクエリする権限を付与する。

```sql
GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
```
## Data Masking
Data maskingは、元のデータを変更、置換、または隠すことで機密データを保護する手法で、マスクされたデータが機密情報を含まなくなる一方で、特定の形式と特性を維持します。

例えば、管理者はクレジットカード番号やID番号などの機密フィールドの一部または全部の数字をアスタリスク*や他の文字に置き換えるか、実名を仮名に置き換えることを選択できます。

バージョン2.1.2以降、Apache RangerのData Maskingを通じてdata maskingがサポートされ、特定の列にマスキングポリシーを設定できます。現在は[Apache Ranger](ranger.md)を通じてのみ利用可能です。

> admin/rootユーザーのData Masking設定は有効になりません。
