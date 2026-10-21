---
{
    "title": "DROP RESOURCE",
    "language": "ko",
    "description": "이 문은 기존 리소스를 삭제하는 데 사용됩니다. root 또는 admin 사용자만 리소스를 삭제할 수 있습니다."
}
---

## 설명 {#description}

이 문은 기존 리소스를 삭제하는 데 사용됩니다. root 또는 admin 사용자만 리소스를 삭제할 수 있습니다.

4.1.5부터 root가 생성한 것으로 표시된 새 AI Resource는 root만 수정하거나 삭제할 수 있으며, 다른 `ADMIN` 사용자는 수정하거나 삭제할 수 없습니다. 업그레이드 이전부터 존재하며 이 표시가 없는 리소스에는 이 제한이 소급 적용되지 않습니다. [AI Resource 권한](../../../sql-functions/ai-functions/overview.md)을 참조하세요.

## 구문 {#syntax}

```sql
DROP RESOURCE '<resource_name>'
```

## 사용 시 참고 사항 {#usage-notes}

사용 중인 ODBC/S3 리소스는 삭제할 수 없습니다.

## 예제 {#examples}

1. spark0이라는 이름의 Spark 리소스를 삭제합니다:
   
     ```sql
     DROP RESOURCE 'spark0';
     ```
