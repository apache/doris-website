---
{
    "title": "CloudDM",
    "language": "ru",
    "description": "Используйте CloudDM для подключения к Apache Doris и управления источниками данных Doris с поддержкой доступа к данным, маскирования, визуального редактирования и CI/CD для баз данных."
}
---

## Обзор {#overview}

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use CloudDM to connect to and manage Apache Doris data sources -->

CloudDM от компании Clougence представляет собой кроссплатформенный инструмент для работы с базами данных, предназначенный для команд и отдельных пользователей. Он помогает безопасно и эффективно вносить изменения в базы данных и управлять ими с соблюдением нормативных требований.

При работе с Apache Doris CloudDM учитывает особенности Doris и поддерживает доступ к данным, маскирование данных, визуальное редактирование и CI/CD для баз данных. Прочитав эту статью, вы сможете выполнить следующие задачи:

- Добавить источник данных Doris в CloudDM.
- Включить управление данными для экземпляра Doris и проверить подключение.
- Использовать CloudDM для доступа к данным Doris и управления ими.

## Подготовка {#preparation}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the CloudDM installation and verify the version before connecting to Doris -->

| Пункт | Требование |
|-------|------|
| CloudDM | CloudDM установлен. Скачать и установить его можно с [официального сайта CloudDM](https://www.cdmgr.com/). |
| Проверенная версия | Инструкции в этой статье проверены на CloudDM 2.8.0.0. |

## Подключение к источнику данных Doris {#connect-to-a-doris-data-source}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris data source connection in CloudDM -->

### 1. Добавьте источник данных Doris {#1-add-a-doris-data-source}

1. Войдите в CloudDM.
2. На панели навигации нажмите **Управление источниками данных** > **Добавить источник данных**.
3. Выберите источник данных Doris.

![Добавление источника данных](/images/next/connection-integration/data-integration/clouddm/clouddm1-en.png)

### 2. Настройте параметры подключения {#2-configure-connection-information}

На странице добавления источника данных укажите следующие параметры подключения:

| Параметр | Описание |
|-------|------|
| Адрес клиента | Порт запросов FE на узле кластера Doris, например `hostID:9030`. |
| Учётная запись | Имя пользователя для входа в кластер Doris, например `admin`. |
| Пароль | Пароль пользователя для входа в кластер Doris. |

:::tip
В Doris используются `internal catalog` и `external catalog`, и CloudDM может управлять ими одновременно.
:::

:::info Примечание
Для управления `external catalog` Doris в виде баз данных `catalog.db` требуется Doris версии 2.1.0 или новее.
:::

### 3. Включите управление данными и проверьте подключение {#3-enable-data-management-and-test-the-connection}

В верхней части страницы нажмите **Настройки запросов** > **Конфигурация запросов**, чтобы включить управление данными для экземпляра Doris и проверить подключение.

![Включение источника данных](/images/next/connection-integration/data-integration/clouddm/clouddm2-en.png)

### 4. Получите доступ к данным Doris {#4-access-doris-data}

После установки подключения к базе данных подключённый источник данных появится на панели навигации по подключениям слева. Через CloudDM вы сможете подключаться к базе данных и управлять ею.

![Установка подключения](/images/next/connection-integration/data-integration/clouddm/clouddm3-en.png)

## Поддерживаемые сценарии управления Doris {#supported-doris-management-scenarios}

<!-- Knowledge type: Feature support -->
<!-- Applicable scenario: Understand which Doris management capabilities CloudDM supports -->

CloudDM поддерживает следующие две категории возможностей Doris:

| Сценарий | Поддерживаемые возможности |
|---------|---------|
| Клиент для выполнения запросов | Визуальное управление объектами баз данных в Doris; написание SQL в консоли для работы с Doris; экспорт результатов запросов. |
| Командная работа | Авторизация на уровне операторов с детализацией до таблиц; согласование заявок; CI/CD для баз данных; маскирование конфиденциальных данных; правила проверки SQL. |
