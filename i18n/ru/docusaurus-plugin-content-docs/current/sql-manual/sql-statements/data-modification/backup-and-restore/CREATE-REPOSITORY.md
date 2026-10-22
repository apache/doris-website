---
{
    "title": "CREATE REPOSITORY",
    "language": "ru",
    "description": "Эта инструкция создаёт репозиторий. Репозитории используются для резервного копирования или восстановления."
}
---

## Описание {#description}

Эта инструкция создаёт репозиторий. Репозитории используются для резервного копирования или восстановления.

## Синтаксис {#syntax}

```sql
CREATE [READ ONLY] REPOSITORY <repo_name>
    WITH [ S3 | HDFS ]
    ON LOCATION <repo_location>
    PROPERTIES (
              -- S3 or HDFS storage property
              <storage_property>
              [ , ... ]
    )
```

## Обязательные параметры {#required-parameters}
**<repo_name>**
> Уникальное имя репозитория.

**<repo_location>**
> Путь к хранилищу репозитория.

**<storage_property>**
> Свойства репозитория. Параметры следует выбирать в зависимости от того, используется ли S3 или HDFS в качестве хранилища.

**<storage_property>** Необязательные параметры приведены ниже. В зависимости от конкретной среды можно добавить дополнительные параметры.

| Параметр               | Описание                            |
|-------------------------|------------------------------------|
| **s3.endpoint**         | Конечная точка сервиса S3                    |
| **s3.access_key**       | Ключ доступа к S3                          |
| **s3.secret_key**       | Секретный ключ S3                          |
| **s3.region**           | Регион S3                              |
| **use_path_style**      | Нужно ли использовать доступ к S3 в режиме path-style (для MinIO) |
| **fs.defaultFS**        | URI файловой системы Hadoop по умолчанию        |
| **hadoop.username**     | Имя пользователя Hadoop                       |

**Примечание:&#x20;**

Doris также поддерживает `AWS Assume Role` при создании репозитория AWS S3. Подробнее см. в разделе [Интеграция с AWS](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

## Требования к правам доступа {#access-control-requirements}

| Привилегия               | Объект                         | Примечания                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | Права управления всем кластером | Только root или суперпользователь может создавать репозитории  |


## Примечания по использованию {#usage-notes}
- Если репозиторий доступен только для чтения, из него можно выполнять только восстановление. В противном случае доступны операции как резервного копирования, так и восстановления.
- Свойства (PROPERTIES) различаются в зависимости от того, используется ли S3 или HDFS, как показано в примере.
- Если используется S3, после ON LOCATION следует указать имя бакета S3.
- При переносе данных необходимо создать один и тот же репозиторий в исходном и целевом кластерах, чтобы целевой кластер мог просматривать снимок данных из резервной копии исходного кластера.
- Любой пользователь может просмотреть созданные репозитории с помощью команды [SHOW REPOSITORIES](./SHOW-REPOSITORIES).


## Примеры {#examples}

Создание репозитория с именем s3_repo.

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://s3-repo"
PROPERTIES
(
    "s3.endpoint" = "http://s3-REGION.amazonaws.com",
    "s3.region" = "s3-REGION",
    "s3.access_key" = "AWS_ACCESS_KEY",
    "s3.secret_key"="AWS_SECRET_KEY"
);
```
**Примечание:&#x20;**

Doris также поддерживает `AWS Assume Role` при создании репозитория AWS S3. Подробнее см. в разделе [Интеграция с AWS](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

Создание репозитория с именем hdfs_repo.

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://hadoop-name-node:54310/path/to/repo/"
PROPERTIES
(
    "fs.defaultFS"="hdfs://hadoop-name-node:54310",
    "hadoop.username"="user"
);
```

Создание репозитория с именем minio_repo для прямого подключения к хранилищу minio по протоколу S3.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "http://minio.com",
    "s3.access_key" = "MINIO_USER",
    "s3.secret_key"="MINIO_PASSWORD",
    "s3.region" = "REGION",
    "use_path_style" = "true"
);
```

Создание репозитория с именем minio_repo с использованием временных учётных данных безопасности.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
( 
    "s3.endpoint" = "AWS_ENDPOINT",
    "s3.access_key" = "AWS_TEMP_ACCESS_KEY",
    "s3.secret_key" = "AWS_TEMP_SECRET_KEY",
    "s3.session_token" = "AWS_TEMP_TOKEN",
    "s3.region" = "AWS_REGION"
)
```

Создание репозитория с использованием Tencent COS

```sql
CREATE REPOSITORY `cos_repo`
WITH S3
ON LOCATION "s3://backet1/"
PROPERTIES
(
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "http://cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing"
);
```
