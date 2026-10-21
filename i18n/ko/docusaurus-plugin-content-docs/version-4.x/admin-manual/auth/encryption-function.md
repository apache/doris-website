---
{
    "title": "암호화 및 마스킹 함수",
    "language": "ko",
    "description": "AES, SM4, MD5, SM3, SHA 및 마스킹 범주별로 정리한 Doris 내장 암호화, 복호화, 해시 다이제스트 및 데이터 마스킹 함수 개요."
}
---

<!-- Knowledge type: Function index -->
<!-- Applicable scenarios: Sensitive data encryption / Data masking / Hash verification -->

Doris는 **암호화, 복호화, 해시 다이제스트 및 데이터 마스킹**을 위한 내장 스칼라 함수를 제공합니다. 이러한 함수는 SQL에서 전화번호, 신분증 번호, 비밀번호 다이제스트와 같은 민감한 필드를 보호하는 데 주로 사용됩니다. 이 페이지에서는 해당 함수를 범주별로 정리합니다. 자세한 구문, 매개변수 및 예제는 각 함수의 SQL 매뉴얼 페이지를 참조하세요.

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 함수 |
| --- | --- |
| 민감한 필드의 대칭 암호화/복호화(국제 알고리즘) | [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) / [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) |
| 민감한 필드의 대칭 암호화/복호화(중국 국가 표준 알고리즘) | [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) / [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) |
| 비가역 해시 다이제스트 생성(비밀번호 저장 또는 데이터 검증 등) | [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5), [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum), [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3), [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum), [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha), [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) |
| 쿼리 출력에서 전화번호, 신분증 번호 등의 필드 마스킹 | [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) |

## 함수 분류 {#function-categories}

<!-- Knowledge type: Function category index -->

모든 내장 암호화 및 마스킹 함수를 알고리즘 계열별로 분류하여 아래에 나열합니다.

### 대칭 암호화 함수 {#symmetric-encryption-functions}

필드에 가역적인 암호화와 복호화를 수행하는 데 사용합니다.

| 함수 | 알고리즘 계열 | 설명 |
| --- | --- | --- |
| [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) | AES (국제 표준) | AES 암호화 |
| [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) | AES (국제 표준) | AES 복호화 |
| [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) | SM4 (중국 국가 표준) | SM4 암호화 |
| [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) | SM4 (중국 국가 표준) | SM4 복호화 |

### 해시 다이제스트 함수 {#hash-digest-functions}

고정 길이의 비가역 다이제스트를 생성하는 데 사용하며, 주로 비밀번호 저장과 데이터 무결성 검증에 활용합니다.

| 함수 | 알고리즘 계열 | 설명 |
| --- | --- | --- |
| [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5) | MD5 | MD5 다이제스트 계산 |
| [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum) | MD5 | MD5 체크섬 계산 |
| [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3) | SM3 (중국 국가 표준) | SM3 다이제스트 계산 |
| [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum) | SM3 (중국 국가 표준) | SM3 체크섬 계산 |
| [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha) | SHA | SHA 다이제스트 계산 |
| [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) | SHA-2 | SHA-2 다이제스트 계산 |

### 데이터 마스킹 함수 {#data-masking-functions}

쿼리 출력에서 민감한 필드를 마스킹하여 표시하는 데 사용합니다.

| 함수 | 설명 |
| --- | --- |
| [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) | 전화번호, 은행 카드 번호 등의 숫자 문자열 마스킹 |
