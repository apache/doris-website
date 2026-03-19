---
{
  "title": "SET TABLE PARTITION VERSION",
  "language": "ja",
  "description": "コンピュート・ストレージ結合モードにおいて。このステートメントは、指定されたパーティションの可視バージョンを手動で変更するために使用されます。いくつかの特殊なケースでは、"
}
---
## 説明

コンピュート・ストレージ結合モードにおいて、この文は指定されたパーティションの可視バージョンを手動で変更するために使用されます。特別な場合において、メタデータ内のパーティションのバージョンが実際のレプリカのバージョンと一致しない可能性があります。

このコマンドは、メタデータ内のパーティションのバージョンを手動で変更できます。このコマンドは一般的に緊急時の障害復旧のためにのみ使用されます。慎重に操作してください。

## 構文

```sql
ADMIN SET TABLE <table_name> PARTITION VERSION PROPERTIES ("<partition_id>" = "visible_version>");
```
## 必須パラメータ

<table_name>

> 設定するテーブルの名前。

<partition_id>

> Partition Idを指定します。

<visible_version>

> Versionを指定します。

## 例

1. FEメタデータ内のpartition_id 10075のパーティションのバージョンを100に設定します。

  ```sql
  ADMIN SET TABLE __internal_schema.audit_log PARTITION VERSION PROPERTIES("partition_id" = "10075", "visible_version" = "100");
  ```
## 使用上の注意

1. パーティションバージョンを設定する前に、BEマシン上の実際のレプリカのバージョンを確認する必要があります。このコマンドは一般的に緊急時の障害復旧のみに使用されます。慎重に操作してください。
2. このコマンドはstorage-computing separation モードではサポートされていません。設定しても効果がありません。
