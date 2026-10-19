---
{
    "title": "INSTALL PLUGIN",
    "language": "ko",
    "description": "이 문은 플러그인을 설치하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 플러그인을 설치하는 데 사용됩니다.

## 구문 {#syntax}

```sql
INSTALL PLUGIN FROM <source> [PROPERTIES ("<key>"="<value>", ...)]
```

## 필수 매개변수 {#required-parameters}

** 1. `<source>`**
>  설치할 플러그인의 경로로, 다음 세 가지 유형을 지원합니다:
>   1. zip 파일의 절대 경로
>   2. 플러그인 디렉터리의 절대 경로
>   3. http 또는 https 프로토콜을 사용하는 zip 파일 다운로드 경로

## 선택적 매개변수 {#optional-parameters}

** 1. `[PROPERTIES ("<key>"="<value>", ...)]`**
>  플러그인을 설치할 때 속성이나 매개변수를 지정하는 데 사용됩니다.

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한         | 객체   | 참고 사항            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 전체 클러스터 | 전체 클러스터에 대한 관리자 권한이 필요합니다. |

## 주의 사항 {#precautions}

http://mywebsite.com/plugin.zip.md5 처럼 .zip 파일과 이름이 같은 md5 파일을 배치해야 합니다. 이 파일에는 .zip 파일의 MD5 값이 들어 있어야 합니다.

## 예제 {#example}

- 로컬 zip 파일에서 플러그인 설치:

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo.zip";
    ```

- 로컬 디렉터리에 있는 플러그인 설치:

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo/";
    ```

- 플러그인 다운로드 및 설치:

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip";
    ```

- 플러그인을 다운로드하여 설치하고 zip 파일의 md5sum 값 설정:

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip" PROPERTIES("md5sum" = "73877f6029216f4314d712086a146570");
    ```
