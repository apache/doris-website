---
{
    "title": "Power BI",
    "language": "ru",
    "description": "Узнайте, как подключиться к Apache Doris из Power BI Desktop, настроить режим DirectQuery или Import и создавать панели с визуализациями на основе данных Doris.",
    "keywords": [
        "Power BI connect Doris",
        "Apache Doris Power BI",
        "Doris Power BI Connector",
        "Power BI DirectQuery Doris",
        "Power BI Import Doris"
    ]
}
---

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Use Power BI Desktop to connect to Apache Doris and build visualization dashboards -->

Microsoft Power BI позволяет выполнять запросы к данным Apache Doris, а также загружать данные в память. С помощью Power BI Desktop можно подключиться к источнику данных Apache Doris и создавать отчёты, аналитические панели и визуализации для анализа данных.

В этой статье описаны следующие операции в порядке их выполнения пользователем:

| Сценарий использования | Цель пользователя | Основные операции |
|----------|-----------|-----------------|
| Подготовка среды подключения | Обеспечить возможность подключения Power BI Desktop к Doris | Установить драйвер MySQL ODBC и коннектор Doris для Power BI |
| Подключение к источнику данных Doris | Получить доступ к экземпляру Apache Doris из Power BI Desktop | Указать источник данных Doris, базу данных, данные аутентификации и режим подключения к данным |
| Выбор режима запросов | Выбрать режим подключения в зависимости от объёма данных и способа их анализа | Использовать DirectQuery для выполнения запросов непосредственно к Doris или Import для загрузки небольшого объёма данных в Power BI |
| Создание панели с визуализациями | Создать аналитический отчёт на основе данных TPC-H в Doris | Настроить связи между таблицами, перетащить поля, создать и сохранить панель |

## Подготовка среды подключения {#prepare-the-connection-environment}

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: Install Power BI Desktop and prepare Doris connection information -->

### Установка Power BI Desktop {#install-power-bi-desktop}

В этой статье предполагается, что Microsoft Power BI Desktop уже установлен на вашем компьютере с Windows. Если он ещё не установлен, перейдите на [страницу загрузки Power BI Desktop](https://www.microsoft.com/en-us/download/details.aspx?id=58494), чтобы скачать и установить его.

Рекомендуется обновить Power BI Desktop до последней версии.

### Подготовка данных для подключения к Doris {#prepare-doris-connection-information}

Перед подключением к Apache Doris подготовьте следующие сведения:

| Параметр | Значение | Пример |
|-----------|---------|---------|
| **Источник данных Doris** | Строка подключения к базе данных в формате `host:port` | `127.0.1.28:9030` |
| **База данных** | Имя базы данных | `test_db` |
| **Режим подключения к данным** | Режим подключения к данным: `Import` или `DirectQuery` | `DirectQuery` |
| **Инструкция SQL** | Инструкция SQL, которая должна содержать имя базы данных; применима только в режиме `Import` | `select * from database.table` |
| **Имя пользователя** | Имя пользователя | `admin` |
| **Пароль** | Пароль | `xxxxxx` |

## Установка драйвера MySQL ODBC {#install-the-mysql-odbc-driver}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Allow Power BI Desktop to connect to Doris through the MySQL ODBC driver -->

Для подключения к Doris из Power BI Desktop сначала необходимо установить драйвер MySQL ODBC.

### Установка драйвера {#install-the-driver}

1. Скачайте и установите [MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/).

2. Выберите и настройте версию 5.3.

3. Запустите скачанный установщик `.msi` и следуйте указаниям мастера установки.

![](/images/next/connection-integration/data-integration/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/next/connection-integration/data-integration/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/next/connection-integration/data-integration/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

После завершения установки появится следующий экран.

![](/images/next/connection-integration/data-integration/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

### Проверка драйвера {#verify-the-driver}

После установки драйвера проверьте результат следующим образом:

1. В меню «Пуск» Windows введите `ODBC` и выберите **Источники данных ODBC (64-разрядная версия)**.

![](/images/next/connection-integration/data-integration/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

2. Убедитесь, что драйвер MySQL отображается в списке драйверов.

![](/images/next/connection-integration/data-integration/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

## Установка коннектора Doris для Power BI {#install-the-doris-power-bi-connector}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Load the Doris custom connector in Power BI Desktop -->

В настоящее время сертификация пользовательских коннекторов Power BI недоступна, поэтому предоставляемый Doris пользовательский коннектор не сертифицирован. Выполните следующие настройки для несертифицированных коннекторов, руководствуясь [документацией по настройке пользовательских коннекторов Power BI](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors).

### Размещение файла коннектора {#place-the-connector-file}

1. Предположим, что `power_bi_path` обозначает каталог установки Power BI Desktop в операционной системе Windows. По умолчанию обычно используется:

    ```text
    power_bi_path = C:\Program Files\Power BI Desktop
    ```

2. Поместите файл пользовательского коннектора [Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) по пути `%power_bi_path%\Custom Connectors folder`.

3. Если указанный путь не существует, создайте его вручную.

### Разрешение загрузки несертифицированных коннекторов {#allow-loading-uncertified-connectors}

1. В Power BI Desktop выберите **Файл**.

![](/images/next/connection-integration/data-integration/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

2. Выберите **Параметры и настройки** > **Параметры**.

![](/images/next/connection-integration/data-integration/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

3. В окне **Параметры** выберите **ГЛОБАЛЬНЫЕ** > **Безопасность**. В разделе **Расширения данных** установите флажок **(Не рекомендуется) Разрешить загрузку любых расширений без проверки и предупреждений**, чтобы снять ограничение на использование несертифицированных коннекторов.

![](/images/next/connection-integration/data-integration/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

4. Нажмите **ОК** и перезапустите Power BI Desktop.

## Подключение к Doris из Power BI Desktop {#connect-to-doris-in-power-bi-desktop}

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenario: Select the Doris connector in Power BI Desktop and fill in connection information -->

После установки драйвера и коннектора можно найти коннектор Doris в Power BI Desktop и создать источник данных Doris.

### Поиск коннектора Doris {#find-the-doris-connector}

1. Запустите Power BI Desktop.

2. На начальном экране Power BI Desktop нажмите **Новый отчёт**. Если у вас уже есть локальный отчёт, можно открыть его.

![](/images/next/connection-integration/data-integration/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. Нажмите **Получить данные** и выберите базу данных Doris во всплывающем окне.

![](/images/next/connection-integration/data-integration/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### Ввод данных для подключения {#fill-in-connection-information}

Выбрав коннектор Doris, введите данные для подключения к экземпляру Doris:

| Параметр | Обязательность | Описание |
|-----------|----------|-------------|
| **Источник данных Doris** | Обязательный | Доменное имя экземпляра Doris, адрес или `host:port` |
| **База данных** | Обязательный | Имя базы данных Doris |
| **Инструкция SQL** | Необязательный | Инструкция SQL для предварительного выполнения; доступна только в режиме `Import` |
| **Режим подключения к данным** | Обязательный | Выберите `DirectQuery` или `Import` |

![](/images/next/connection-integration/data-integration/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

Рекомендации по выбору режима подключения:

| Режим | Сценарий применения | Описание |
|------|---------------------|-------------|
| **DirectQuery** | Рекомендуется для выполнения запросов непосредственно к Doris | Power BI отправляет запросы непосредственно в Doris без загрузки всего набора данных |
| **Import** | Подходит для небольших объёмов данных | Весь набор данных загружается в Power BI |

:::note

Для выполнения запросов непосредственно к Doris рекомендуется выбирать `DirectQuery`. Если вы работаете с небольшим объёмом данных, можно выбрать режим `Import`.

:::

### Ввод имени пользователя и пароля {#enter-user-name-and-password}

Укажите имя пользователя и пароль Doris.

![](/images/next/connection-integration/data-integration/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### Загрузка схемы таблиц и предварительный просмотр данных {#load-the-table-schema-and-preview-data}

В окне навигатора должны отображаться базы данных и таблицы. Выберите нужные таблицы и нажмите **Загрузить**, чтобы загрузить схему таблиц и данные для предварительного просмотра из Apache Doris.

![](/images/next/connection-integration/data-integration/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

После завершения импорта данные Doris будут доступны в Power BI. Затем можно настроить нужную панель статистики.

![](/images/next/connection-integration/data-integration/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Создание панели с визуализациями в Power BI {#build-a-visualization-dashboard-in-power-bi}

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Use Doris TPC-H data to create an order revenue statistics dashboard in Power BI -->

В этом примере в качестве источника используются данные TPC-H. О том, как подготовить источник данных Doris TPC-H, читайте в [документации Doris TPC-H Benchmark](../../lakehouse/best-practices/tpch.md).

Предположим, вам нужно подсчитать выручку от заказов по регионам. Для создания панели выполните следующие действия.

### Настройка связей между таблицами модели {#create-table-model-relationships}

1. Нажмите **Представление модели**, чтобы открыть экран настройки связей между таблицами модели.

![](/images/next/connection-integration/data-integration/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. При необходимости перетащите четыре таблицы `customer`, `nation`, `orders` и `region` на один экран, затем перетащите соответствующие поля, чтобы связать таблицы.

![](/images/next/connection-integration/data-integration/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/next/connection-integration/data-integration/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

Связи между четырьмя таблицами выглядят следующим образом:

| Исходная таблица | Исходное поле | Целевая таблица | Целевое поле |
|--------------|--------------|--------------|--------------|
| `customer` | `c_nationkey` | `nation` | `n_nationkey` |
| `customer` | `c_custkey` | `orders` | `o_custkey` |
| `nation` | `n_regionkey` | `region` | `r_regionkey` |

3. После настройки связей результат будет выглядеть следующим образом.

![](/images/next/connection-integration/data-integration/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

### Настройка панели выручки от заказов {#configure-the-order-revenue-dashboard}

1. Вернитесь в рабочую область **Представление отчёта** и начните создавать панель.

2. Перетащите `o_totalprice` из таблицы `orders` на панель.

![](/images/next/connection-integration/data-integration/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

3. Перетащите `r_name` из таблицы `region` в столбец X.

![](/images/next/connection-integration/data-integration/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

4. Теперь на панели отображаются нужные данные.

![](/images/next/connection-integration/data-integration/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

5. Нажмите кнопку сохранения в левом верхнем углу рабочей области, чтобы сохранить созданную панель статистики локально.

![](/images/next/connection-integration/data-integration/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

Теперь вы успешно подключили Power BI к Apache Doris, выполнили анализ данных и создали панель с визуализациями.
