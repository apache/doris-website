---
{
    "title": "Azure Blob",
    "language": "ko",
    "description": "Doris는 버전 3.1.3부터 Azure Blob 스토리지 액세스를 지원합니다."
}
---

Doris는 버전 3.1.3부터 Azure Blob 스토리지 액세스를 지원합니다.

이 문서에서는 Microsoft Azure Blob 스토리지에 액세스하는 데 필요한 파라미터를 설명합니다. 이 파라미터는 다음 시나리오에 적용됩니다.

- Catalog 속성
- Table Valued Function 속성
- Broker Load 속성
- Export 속성
- Outfile 속성
- Backup / Restore 속성

**Azure Blob Storage는 현재 ARM 아키텍처를 지원하지 않습니다.**

## HTTPS용 BE CA 인증서 설정 {#configure-be-ca-certificate-for-https}

Doris 3.1.5 및 4.0.5부터는 Doris BE가 HTTPS를 통해 Azure Blob Storage에 액세스할 때 `ca_cert_file_paths`를 `be.conf`에 명시적으로 설정할 수 있습니다.

`ca_cert_file_paths`를 설정하지 않으면 Doris는 기본적으로 운영 체제의 기본 CA 인증서를 사용합니다. 대부분의 환경에서는 이 파라미터를 수동으로 설정할 필요가 없습니다. 다음과 같은 경우에 설정하세요.

- BE 노드에 시스템 CA 인증서가 없거나 설치된 CA 번들이 너무 오래된 경우
- BE 노드가 `ca-certificates` 패키지를 포함하지 않는 최소 구성의 컨테이너나 이미지에서 실행되는 경우
- BE 노드의 기본 CA 파일 경로가 유효하지 않거나 Doris 프로세스에 CA 파일 읽기 권한이 없는 경우
- 환경에서 자체 서명 인증서, 사설 CA 또는 TLS 트래픽을 다시 서명하는 기업용 프록시나 게이트웨이를 사용하는 경우
- Azure Blob Storage에 액세스할 때 `Problem with the SSL CA cert` 또는 `curl 77: Problem with the SSL CA cert (path? access rights?)`와 같은 오류가 발생하는 경우

> **`ca_cert_file_paths`가 없는 버전의 경우:** `ca_cert_file_paths` 파라미터는 Doris 3.1.5 및 4.0.5부터 사용할 수 있습니다. 이전 버전을 사용하면서 SSL CA 인증서 오류가 발생하면 시스템 CA 인증서가 올바르게 설치되어 있고 CA 번들이 `/etc/ssl/certs/ca-certificates.crt`에 있는지 확인해야 합니다.
>
> - **RHEL / CentOS / RockyLinux:**
>   ```bash
>   yum install -y ca-certificates
>   update-ca-trust
>   ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
>   ```
> - **Debian / Ubuntu:** `apt-get install -y ca-certificates`
>
> 그런 다음 모든 BE 노드를 다시 시작하세요. 인증서 문제에 대한 자세한 내용은 [Lakehouse FAQ - 인증서 문제](../../faq/lakehouse-faq.md#certificate-issues)를 참조하세요.

예시:

```properties
# be.conf
ca_cert_file_paths = /etc/ssl/certs/ca-certificates.crt
```

일반적인 CA 번들 경로:

- Debian / Ubuntu: `/etc/ssl/certs/ca-certificates.crt`
- CentOS / RockyLinux: `/etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt`

Azure Blob Storage에 액세스할 수 있는 모든 BE 노드에 이 항목을 설정하고, 인증서 파일이 존재하며 Doris 프로세스가 읽을 수 있는지 확인하세요. `be.conf`를 수정한 후에는 해당 BE 노드를 다시 시작하여 변경 사항을 적용하세요.

## 파라미터 개요 {#parameter-overview}

| 속성 이름                  | 이전 이름   | 설명                     | 기본값 | 필수 여부 |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Azure 스토리지 계정 이름(Account Name)으로, Azure 포털에서 생성한 스토리지 계정의 이름입니다. |               | 예      |
| azure.account_key              |               | Azure Blob 스토리지의 계정 키 |               | 예      |
| azure.endpoint                 |               | Azure Blob 스토리지의 액세스 엔드포인트로, 일반적으로 https://<account_name>.blob.core.windows.net 형식입니다. |               | 예      |
| fs.azure.support               |               | Azure Blob 스토리지 활성화 여부 | true          | 예      |

- Azure Blob Storage 활성화

  Azure Blob 스토리지가 활성화되었음을 나타내려면 `"provider" = "AZURE"` 또는 `"fs.azure.support" = "true"`를 명시적으로 설정해야 합니다.

- `azure.account_name` 확인

  1. [Azure Portal](https://portal.azure.com)에 로그인합니다.
  2. **스토리지 계정**을 열고 대상 계정을 선택합니다.
  3. **개요** 페이지에서 **스토리지 계정 이름**을 확인할 수 있습니다.

  ```properties
  "azure.account_name" = "myblobstorage"
  ```

- `azure.account_key` 확인

  1. [Azure Portal](https://portal.azure.com)에 로그인합니다.
  2. **스토리지 계정**을 열고 대상 계정을 선택합니다.
  3. 왼쪽 탐색 모음에서 **액세스 키**를 선택합니다.
  4. **key1** 또는 **key2**에서 "키 표시"를 클릭하고 **키 값**을 복사합니다.

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
