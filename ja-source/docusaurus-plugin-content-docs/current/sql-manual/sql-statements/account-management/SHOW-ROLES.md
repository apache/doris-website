---
{
  "title": "SHOW ROLES",
  "language": "ja",
  "description": "SHOW ROLES文は、ロール名、含まれるユーザー、および権限を含む、作成されたすべてのロール情報を表示するために使用されます。"
}
---
## 説明

`SHOW ROLES`文は、作成されたすべてのロール情報を表示するために使用されます。これには、ロール名、含まれるユーザー、および権限が含まれます。

## 構文

```sql
SHOW ROLES
```
## 戻り値

| Column                | DataType    | Note                           |
|-----------------------|-------------|--------------------------------|
| Name                  | string      | ロール名                        |
| Comment               | string      | コメント                        |
| Users                 | string      | 含まれるユーザー                |
| GlobalPrivs           | string      | グローバル権限                  |
| CatalogPrivs          | string      | カタログ権限                    |
| DatabasePrivs         | string      | データベース権限                |
| TablePrivs            | string      | テーブル権限                    |
| ResourcePrivs         | string      | リソース権限                    |
| WorkloadGroupPrivs    | string      | Workload Group権限             |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| GRANT_PRIV    | USER or ROLE    | この操作はGRANT_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意

Dorisは各ユーザーに対してデフォルトロールを作成します。デフォルトロールを表示したい場合は、コマンド```set show_user_default_role=true;```を実行してください。

## 例

- 作成されたロールを表示

```sql
SHOW ROLES
```
