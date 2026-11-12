---
{
    "title": "Aliyun DLF",
    "language": "ru",
    "description": "В этом документе описано, как использовать оператор CREATE CATALOG для подключения к службе метаданных Alibaba Cloud Data Lake Formation (DLF) и доступа к ней."
}
---

В этом документе описано, как использовать оператор `CREATE CATALOG` для подключения к службе метаданных Alibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) и доступа к ней.

## Примечания о версиях DLF {#dlf-version-notes}

- В версии DLF 1.0 Doris обращается к DLF через интерфейс, совместимый с Hive Metastore. Поддерживаются Paimon Catalog и Hive Catalog.
- В версиях DLF 2.5 и более поздних Doris обращается к DLF через интерфейс Rest. Поддерживается только Paimon Catalog.

### DLF 1.0 {#dlf-10}

| Имя параметра | Прежнее имя | Описание | Значение по умолчанию | Обязательный |
|----------------|-------------|-------------|---------------|----------|
| `dlf.endpoint` | - | Конечная точка DLF, см. [документацию Alibaba Cloud](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | Не задано | Да |
| `dlf.region` | - | Регион DLF, см. [документацию Alibaba Cloud](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | Не задано | Да |
| `dlf.uid` | - | Идентификатор учётной записи Alibaba Cloud. Его можно найти в разделе личной информации в правом верхнем углу консоли. | Не задано | Да |
| `dlf.access_key` | - | AccessKey Alibaba Cloud для доступа к службе DLF. | Не задано | Да |
| `dlf.secret_key` | - | SecretKey Alibaba Cloud для доступа к службе DLF. | Не задано | Да |
| `dlf.catalog_id` | `dlf.catalog.id` | Идентификатор Catalog. Используется для указания Catalog метаданных. Если не задан, используется Catalog по умолчанию. | Не задано | Нет |
| `warehouse` | - | Путь хранения Warehouse, требуется только для Paimon Catalog. Обратите внимание: путь в объектном хранилище должен заканчиваться на `/`. | Не задано | Нет |

> Примечание:
>
> Для версий до 3.1.0 используйте прежние имена параметров.

### DLF 2.5+ (Rest Catalog) {#dlf-25-rest-catalog}

> Поддерживается начиная с версии 3.1.0

| Имя параметра | Прежнее имя | Описание | Значение по умолчанию | Обязательный |
|----------------|-------------|-------------|---------------|----------|
| `uri` | - | REST URI службы DLF. Пример: http://cn-beijing-vpc.dlf.aliyuncs.com | Не задано | Да |
| `warehouse` | - | Имя Warehouse. Примечание: укажите непосредственно имя Catalog, к которому нужно подключиться, а не путь хранения таблиц Paimon | Не задано | Да |
| `paimon.rest.token.provider` | - | Поставщик токенов, фиксированное значение `dlf` | Не задано | Да |
| `paimon.rest.dlf.access-key-id` | - | AccessKey Alibaba Cloud для доступа к службе DLF. | Не задано | Да |
| `paimon.rest.dlf.access-key-secret` | - | SecretKey Alibaba Cloud для доступа к службе DLF. | Не задано | Да |

DLF Rest Catalog не требует указания Endpoint и Region службы хранения (OSS). Doris использует механизм Vended Credential в DLF Rest Catalog для получения временных учётных данных для доступа к OSS.

## Примеры {#examples}

### DLF 1.0 {#dlf-10-1}

Создание Hive Catalog с DLF в качестве службы метаданных:

```sql
CREATE CATALOG hive_dlf_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'dlf',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

Создание Paimon Catalog с DLF в качестве службы метаданных:

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.endpoint' = '<DLF_ENDPOINT>',
    'dlf.region' = '<DLF_REGION>',
    'dlf.uid' = '<YOUR_ALICLOUD_UID>',
    'dlf.access_key' = '<YOUR_ACCESS_KEY>',
    'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### DLF 2.5+ (Rest Catalog) {#dlf-25-rest-catalog-1}

```sql
CREATE CATALOG paimon_dlf_test PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'rest',
    'uri' = 'http://cn-beijing-vpc.dlf.aliyuncs.com',
    'warehouse' = 'my_catalog_name',
    'paimon.rest.token.provider' = 'dlf',
    'paimon.rest.dlf.access-key-id' = '<YOUR_ACCESS_KEY>',
    'paimon.rest.dlf.access-key-secret' = '<YOUR_SECRET_KEY>'
);
```
