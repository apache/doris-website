---
{
    "title": "DROP RESOURCE",
    "language": "ja",
    "description": "この文は既存のリソースを削除するために使用します。リソースを削除できるのは root または admin ユーザーのみです。"
}
---

## 説明

この文は既存のリソースを削除するために使用します。リソースを削除できるのは root または admin ユーザーのみです。

## 構文

```sql
DROP RESOURCE '<resource_name>'
```

## 使用上の注意

使用中の ODBC/S3 リソースは削除できません。

## 例

1. spark0 という名前の Spark リソースを削除します。
   
     ```sql
     DROP RESOURCE 'spark0';
     ```
