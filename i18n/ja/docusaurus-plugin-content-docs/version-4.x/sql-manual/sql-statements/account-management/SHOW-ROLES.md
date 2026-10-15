---
{
    "title": "SHOW ROLES",
    "language": "ja",
    "description": "SHOW ROLES 文は、作成済みのすべてのロールについて、ロール名、所属ユーザー、権限などを表示します。"
}
---

## 説明

`SHOW ROLES` 文は、作成済みのすべてのロールについて、ロール名、所属ユーザー、権限などを表示します。

## 構文 

```sql
SHOW ROLES
```

## 戻り値

| 列                | データ型    | 説明                           |
|-----------------------|-------------|--------------------------------|
| Name                  | string      | ロール名                      |
| Comment               | string      | コメント                        |
| Users                 | string      | 所属ユーザー                 |
| GlobalPrivs           | string      | グローバル権限              |
| CatalogPrivs          | string      | カタログ権限             |
| DatabasePrivs         | string      | データベース権限            |
| TablePrivs            | string      | テーブル権限               |
| ResourcePrivs         | string      | リソース権限            |
| WorkloadGroupPrivs    | string      | ワークロードグループ権限      |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 説明 |
|:--------------|:----------|:------|
| GRANT_PRIV    | USER or ROLE    | この操作を実行できるのは GRANT_PRIV 権限を持つユーザーまたはロールのみです  |

## 使用上の注意

Doris は各ユーザーにデフォルトロールを作成します。デフォルトロールを表示するには、コマンド ```set show_user_default_role=true;``` を実行します。

## 例

- 作成済みのロールを表示します

```sql
SHOW ROLES
```