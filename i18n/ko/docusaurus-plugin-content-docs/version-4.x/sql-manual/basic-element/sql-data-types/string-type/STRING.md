---
{
    "title": "STRING",
    "language": "ko",
    "description": "가변 길이 문자열. 기본 지원 길이는 10485760바이트(10 MiB)이며 최대 2147483643바이트(2G)까지 조정할 수 있습니다."
}
---

## STRING {#string}
### 설명 {#description}
기본 소프트 길이 제한이 10485760바이트(10 MiB)인 가변 길이 문자열입니다. 이 제한을 늘리려면 BE에서 `string_type_length_soft_limit_bytes`를 설정하세요. 최대 2147483643바이트(약 2 GiB)까지 늘릴 수 있습니다. STRING은 value 열에만 사용할 수 있으며 key 열, 파티션 열, 버킷 열에는 사용할 수 없습니다.

참고: 가변 길이 문자열은 UTF-8 인코딩으로 저장되므로 일반적으로 영어 문자는 1바이트, 중국어 문자는 3바이트를 차지합니다.

### 키워드 {#keywords}
STRING

### 타입 별칭과 메타데이터 표시 {#type-aliases-and-metadata-display}

`STRING`과 `TEXT`는 동일한 Doris 타입을 정의합니다. 인터페이스에 따라 이 타입이 다르게 표시됩니다.

| 인터페이스 | `STRING` 열의 표시 값 |
| --- | --- |
| `SHOW CREATE TABLE` 및 `DESC` | `text` |
| `information_schema.columns.DATA_TYPE` | MySQL 호환성을 위해 `varchar`로 표시 |
| `information_schema.columns.COLUMN_TYPE` | `string` |

이러한 표시 이름은 저장된 타입이나 길이 제한을 변경하지 않습니다. 메타데이터에서 Doris `STRING` 열과 길이 제한이 있는 `VARCHAR` 열을 구분하려면 `COLUMN_TYPE`을 확인하세요.
