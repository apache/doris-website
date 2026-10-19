---
{
    "title": "SHOW STORAGE VAULTS",
    "language": "ko",
    "description": "SHOW STORAGE VAULTS 명령은 시스템에 구성된 모든 스토리지 볼트의 정보를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

SHOW STORAGE VAULTS 명령은 시스템에 구성된 모든 스토리지 볼트의 정보를 표시하는 데 사용됩니다. 스토리지 볼트는 데이터를 저장할 외부 저장소 위치를 관리하는 데 사용됩니다.

## 구문 {#syntax}

```sql
    SHOW STORAGE VAULTS
```

## 반환 값 {#return-values}

이 명령은 다음 열로 구성된 결과 집합을 반환합니다:

- `StorageVaultName`: 스토리지 볼트의 이름입니다.
- `StorageVaultId`: 스토리지 볼트의 ID입니다.
- `Properties`: 볼트의 구성 속성이 포함된 JSON 문자열입니다.
- `IsDefault`: 이 볼트가 기본값으로 설정되어 있는지 나타냅니다(TRUE 또는 FALSE).

## 관련 명령어 {#related-commands}

- [CREATE STORAGE VAULT](./CREATE-STORAGE-VAULT)
- [GRANT](../../account-management/GRANT-TO)
- [REVOKE](../../account-management/REVOKE-FROM)
- [SET DEFAULT STORAGE VAULT](./SET-DEFAULT-STORAGE-VAULT)

## 키워드 {#keywords}

    SHOW, STORAGE VAULTS
