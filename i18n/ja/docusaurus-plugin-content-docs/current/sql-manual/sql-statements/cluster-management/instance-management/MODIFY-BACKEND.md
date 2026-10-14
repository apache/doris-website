---
{
    "title": "MODIFY BACKEND",
    "language": "ja",
    "description": "BE ノードの属性を変更します。変更は対象ノードのクエリ、書き込み、データ配置に影響します。"
}
---

## 説明

このステートメントは BE ノードの属性を変更します。BE ノードの属性を変更すると、対象ノードのクエリ、書き込み、データ配置に影響します。変更できる属性は次のとおりです。

| プロパティ | 効果 |
|---|---|
| `tag.location` | BE のリソースタグ。デフォルト値は `default` です。変更すると、同じタググループ内の BE 間でのデータの均衡化と、テーブル作成時にデータの配置先となる BE ノードに影響します。詳しくは[リソースグループ](../../../../admin-manual/workload-management/resource-group.md)を参照してください。 |
| `disable_query` | クエリを無効にするかどうかを指定します。デフォルト値は `false` です。`true` に設定すると、この BE ノードに新しいクエリリクエストがスケジュールされなくなります。 |
| `disable_load` | ロードを無効にするかどうかを指定します。デフォルト値は `false` です。`true` に設定すると、この BE ノードに新しいインポートリクエストがスケジュールされなくなります。 |

:::tip
このコマンドはストレージとコンピューティングを分離したモードではサポートされません。
:::

## 構文

```sql
ALTER SYSTEM MODIFY BACKEND <be_identifier> [, <be_identifier> ... ]
SET (
     "<key>" = "<value>"
)
```

ここで:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 必須パラメータ

**1. <be_host>**

> BE ノードのホスト名または IP アドレスを指定します。

**2. <heartbeat_port>**

> BE ノードのハートビートポートです。デフォルトは 9050 です。

**3. <backend_id>**

> BE ノードの ID です。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>` は、いずれも [SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントで確認できます。
:::

## アクセス制御要件

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|---|---|---|
| NODE_PRIV | | |

## 使用上の注意

この操作は BE 全体に適用され、影響範囲が広いため、慎重に実行しないとクラスター全体の通常のクエリ、ロード、さらにはテーブル作成にも影響する可能性があります。操作する際は注意してください。

## 例

1. BE のリソースタグを変更します。

```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("tag.location" = "group_a");
```

2. BE の `disable_query` 属性を変更します。
   
```sql
ALTER SYSTEM MODIFY BACKEND "10002" SET ("disable_query" = "true");
```

3. BE の `disable_load` 属性を変更します。
   
```sql
ALTER SYSTEM MODIFY BACKEND "127.0.0.1:9050" SET ("disable_load" = "true");
```
