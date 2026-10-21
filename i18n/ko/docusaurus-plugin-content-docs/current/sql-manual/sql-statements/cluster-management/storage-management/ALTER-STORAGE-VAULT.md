---
{
    "title": "ALTER STORAGE VAULT",
    "language": "ko",
    "description": "Storage Vault의 변경 가능한 속성을 수정합니다."
}
---

## 설명 {#description}

Storage Vault의 변경 가능한 속성을 수정합니다.

## 구문 {#syntax}

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## 필수 매개변수 {#required-parameters}

**<storage_vault_property>**

> - type: 가능한 값은 s3, hdfs입니다. 3.0.8 이후에는 이 필드가 선택 사항입니다.

>type이 s3인 경우 허용되는 속성 필드는 다음과 같습니다.
>
>- s3.access_key: s3 vault의 ak
>- s3.secret_key: s3 vault의 sk
>- vault_name: vault의 이름입니다. `SET <original_vault_name> DEFAULT STORAGE VAULT` 문을 사용하여 vault를 기본 Storage Vault로 설정한 경우에는 이름을 변경할 수 없습니다. vault의 이름을 변경하려면 먼저 `UNSET DEFAULT STORAGE VAULT` 명령을 실행하여 기본 Storage Vault 설정을 해제한 다음 이름을 변경해야 합니다. 마지막으로, 이름을 변경한 vault를 기본 Storage Vault로 설정해야 하는 경우 `SET <new_vault_name> DEFAULT STORAGE VAULT` 문을 사용할 수 있습니다.
>- use_path_style: path style url 허용 여부입니다. 가능한 값은 true, false이며, 기본값은 false입니다.

>type이 hdfs인 경우 허용되는 속성 필드는 다음과 같습니다.
>
>- path_prefix: 저장 경로 접두사
>- fs.defaultFS: hdfs 이름

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 ADMIN_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

s3 Storage Vault의 ak 수정

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

hdfs Storage Vault 수정

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
