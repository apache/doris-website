---
{
    "title": "DROP RESOURCE",
    "language": "ja",
    "description": "この文は既存のリソースを削除するために使用します。リソースを削除できるのは root または admin ユーザーのみです。"
}
---

## 説明 {#description}

この文は既存のリソースを削除するために使用します。リソースを削除できるのは root または admin ユーザーのみです。

4.1.5 以降、root によって作成されたことを示すマークが付いた新規の AI リソースを変更または削除できるのは root のみです。他の `ADMIN` ユーザーは変更も削除もできません。アップグレード前から存在し、このマークが付いていないリソースには、この制限はさかのぼって適用されません。詳しくは [AI リソースの権限](../../../sql-functions/ai-functions/overview.md)を参照してください。

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
