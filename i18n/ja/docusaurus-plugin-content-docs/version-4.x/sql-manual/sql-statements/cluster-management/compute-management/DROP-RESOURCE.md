---
{
    "title": "DROP RESOURCE",
    "language": "ja",
    "description": "このステートメントは、既存のリソースを削除するために使用します。リソースを削除できるのは、root または admin ユーザーだけです。"
}
---

## 説明 {#description}

このステートメントは、既存のリソースを削除するために使用します。リソースを削除できるのは、root または admin ユーザーだけです。

4.1.5 以降、root が作成したことを示すマークが付いた新規作成の AI Resource を変更または削除できるのは root だけです。他の `ADMIN` ユーザーは変更または削除できません。アップグレード前に作成され、このマークが付いていないリソースには、遡及して制限は適用されません。詳しくは [AI Resource の権限](../../../sql-functions/ai-functions/overview.md) を参照してください。

## 構文 {#syntax}

```sql
DROP RESOURCE '<resource_name>'
```

## 使用上の注意 {#usage-notes}

使用中の ODBC/S3 リソースは削除できません。

## 例 {#examples}

1. spark0 という名前の Spark リソースを削除します。

     ```sql
     DROP RESOURCE 'spark0';
     ```
