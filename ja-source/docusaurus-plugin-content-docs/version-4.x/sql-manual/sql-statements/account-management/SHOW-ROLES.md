---
{
  "title": "SHOW ROLES",
  "description": "SHOW ROLES文は、ロール名、含まれるユーザー、権限を含む、作成されたすべてのロール情報を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

`SHOW ROLES`ステートメントは、ロール名、含まれるユーザー、および権限を含む、作成されたすべてのロール情報を表示するために使用されます。

## 構文

```sql
SHOW ROLES
```
## 戻り値

| Column                | DataType    | Note                           |
|-----------------------|-------------|--------------------------------|
| Name                  | string      | ロール名                        |
| Comment               | string      | コメント                        |
| Users                 | string      | 含まれるユーザー                 |
| GlobalPrivs           | string      | グローバル権限                   |
| CatalogPrivs          | string      | カタログ権限                     |
| DatabasePrivs         | string      | データベース権限                 |
| TablePrivs            | string      | Table権限                     |
| ResourcePrivs         | string      | リソース権限                     |
| WorkloadGroupPrivs    | string      | ワークロードグループ権限          |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege     | Object    | 注釈 |
|:--------------|:----------|:------|
| GRANT_PRIV    | USER or ROLE    | この操作はGRANT_PRIV権限を持つユーザーまたはロールによってのみ実行できます  |

## 使用上の注意

Dorisは各ユーザーに対してデフォルトロールを作成します。デフォルトロールを表示したい場合は、```set show_user_default_role=true;```コマンドを実行できます。

## 例

- 作成されたロールを表示

```sql
SHOW ROLES
```
