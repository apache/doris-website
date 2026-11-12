---
{
    "title": "Azure Blob",
    "language": "ru",
    "description": "Начиная с версии 3.1.3, Doris поддерживает доступ к хранилищу Azure Blob."
}
---

Начиная с версии 3.1.3, Doris поддерживает доступ к хранилищу Azure Blob.

В этом документе описаны параметры доступа к хранилищу Microsoft Azure Blob, которые применяются в следующих сценариях:

- Свойства Catalog
- Свойства Table Valued Function
- Свойства Broker Load
- Свойства Export
- Свойства Outfile
- Свойства Backup / Restore

**Azure Blob Storage в настоящее время не поддерживает архитектуры ARM.**

## Настройка сертификата CA на BE для HTTPS {#configure-be-ca-certificate-for-https}

Начиная с Doris 3.1.5 и 4.0.5, при доступе Doris BE к Azure Blob Storage по HTTPS можно явно настроить `ca_cert_file_paths` в `be.conf`.

По умолчанию, если `ca_cert_file_paths` не настроен, Doris использует стандартные сертификаты CA операционной системы. В большинстве сред задавать этот параметр вручную не требуется. Настройте его в следующих случаях:

- На узле BE отсутствуют системные сертификаты CA или установленный набор сертификатов CA устарел.
- Узел BE работает в минимальном контейнере или образе, в котором отсутствует пакет `ca-certificates`.
- Стандартный путь к файлу CA на узле BE недействителен или у процесса Doris нет прав на чтение этого файла.
- В вашей среде используется самоподписанный сертификат, частный центр сертификации CA либо корпоративный прокси-сервер или шлюз, который повторно подписывает TLS-трафик.
- При доступе к Azure Blob Storage возникают ошибки, такие как `Problem with the SSL CA cert` или `curl 77: Problem with the SSL CA cert (path? access rights?)`.

> **Для версий без `ca_cert_file_paths`:** Параметр `ca_cert_file_paths` доступен начиная с Doris 3.1.5 и 4.0.5. Если вы используете более раннюю версию и сталкиваетесь с ошибками сертификатов SSL CA, убедитесь, что системные сертификаты CA установлены правильно, а набор сертификатов CA находится по пути `/etc/ssl/certs/ca-certificates.crt`:
>
> - **RHEL / CentOS / RockyLinux:**
>   ```bash
>   yum install -y ca-certificates
>   update-ca-trust
>   ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
>   ```
> - **Debian / Ubuntu:** `apt-get install -y ca-certificates`
>
> Затем перезапустите все узлы BE. Подробнее о проблемах с сертификатами см. в разделе [Часто задаваемые вопросы по Lakehouse — проблемы с сертификатами](../../faq/lakehouse-faq.md#certificate-issues).

Пример:

```properties
# be.conf
ca_cert_file_paths = /etc/ssl/certs/ca-certificates.crt
```

Распространенные пути к наборам сертификатов CA:

- Debian / Ubuntu: `/etc/ssl/certs/ca-certificates.crt`
- CentOS / RockyLinux: `/etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt`

Настройте этот параметр на каждом узле BE, которому может потребоваться доступ к Azure Blob Storage, и убедитесь, что файл сертификатов существует и доступен для чтения процессу Doris. После обновления `be.conf` перезапустите соответствующие узлы BE, чтобы применить изменение.

## Обзор параметров {#parameter-overview}

| Имя свойства                   | Прежнее имя   | Описание                        | Значение по умолчанию | Обязательное |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Имя учетной записи хранилища Azure (имя учетной записи), то есть имя учетной записи хранилища, созданной на портале Azure. |               | Да       |
| azure.account_key              |               | Ключ учетной записи для хранилища Azure Blob |               | Да       |
| azure.endpoint                 |               | Конечная точка доступа к хранилищу Azure Blob, обычно в формате https://<account_name>.blob.core.windows.net |               | Да       |
| fs.azure.support               |               | Определяет, включено ли хранилище Azure Blob | true          | Да       |

- Включение Azure Blob Storage

  Необходимо явно задать `"provider" = "AZURE"` или `"fs.azure.support" = "true"`, чтобы указать, что хранилище Azure Blob включено.

- Получение `azure.account_name`

  1. Войдите на [портал Azure](https://portal.azure.com)
  2. Откройте раздел **Учетные записи хранения** и выберите нужную учетную запись
  3. **Имя учетной записи хранения** отображается на странице **Обзор**

  ```properties
  "azure.account_name" = "myblobstorage"
  ```

- Получение `azure.account_key`

  1. Войдите на [портал Azure](https://portal.azure.com)
  2. Откройте раздел **Учетные записи хранения** и выберите нужную учетную запись
  3. Выберите **Ключи доступа** на левой панели навигации
  4. Нажмите «Показать ключ» в разделе **key1** или **key2** и скопируйте **значение ключа**

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
