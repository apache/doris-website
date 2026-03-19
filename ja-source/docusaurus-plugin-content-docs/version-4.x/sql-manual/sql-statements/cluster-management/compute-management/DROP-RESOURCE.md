---
{
  "title": "RESOURCE を削除",
  "description": "この文は既存のリソースを削除するために使用されます。rootまたはadminユーザーのみがリソースを削除できます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは既存のリソースを削除するために使用されます。rootまたはadminユーザーのみがリソースを削除できます。

## Syntax

```sql
DROP RESOURCE '<resource_name>'
```
## 使用上の注意

使用中のODBC/S3リソースは削除できません。

## 例

1. spark0という名前のSparkリソースを削除する：

     ```sql
     DROP RESOURCE 'spark0';
     ```
