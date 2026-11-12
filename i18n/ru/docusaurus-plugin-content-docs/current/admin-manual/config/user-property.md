---
{
    "title": "Свойства пользователя",
    "language": "ru",
    "description": "В этом документе описаны параметры конфигурации на уровне пользователя."
}
---

# Настройки пользователя {#user-configuration-item}

В этом документе описаны параметры конфигурации на уровне пользователя. Эти настройки действуют только для отдельного пользователя. Каждый пользователь может задать собственные свойства, не влияя на настройки других пользователей.

## Просмотр настроек {#view-configuration-items}

После запуска FE выполните в клиенте MySQL следующую команду, чтобы просмотреть настройки пользователя:

`SHOW PROPERTY [FOR user] [LIKE key pattern]`

Подробное описание синтаксиса можно получить с помощью команды: `help show property;`.

## Изменение настроек {#set-configuration-items}

После запуска FE выполните в клиенте MySQL следующую команду, чтобы изменить настройки пользователя:

`SET PROPERTY [FOR'user'] 'key' = 'value' [,'key' ='value']`

Подробное описание синтаксиса можно получить с помощью команды: `help set property;`.

Настройки на уровне пользователя действуют только для указанных пользователей и не влияют на настройки других пользователей.

## Примеры использования {#application-examples}

1. Изменение max_user_connections для пользователя Billie

    Используйте `SHOW PROPERTY FOR 'Billie' LIKE '%max_user_connections%';`, чтобы убедиться, что текущее максимальное количество подключений для пользователя Billie составляет 100.

    Используйте `SET PROPERTY FOR 'Billie' 'max_user_connections' = '200';`, чтобы изменить максимальное количество подключений для пользователя Billie на 200.

## Список параметров конфигурации {#configuration-item-list}

### max_user_connections {#max_user_connections}

    The maximum number of user connections, the default value is 100 In general, this parameter does not need to be changed unless the number of concurrent queries exceeds the default value.

### max_query_instances {#max_query_instances}

    The maximum number of instances that the user can use at a certain point in time, The default value is -1, negative number means use default_max_query_instances config.

### resource {#resource}

### quota {#quota}

### default_load_cluster {#default_load_cluster}

### load_cluster {#load_cluster}
