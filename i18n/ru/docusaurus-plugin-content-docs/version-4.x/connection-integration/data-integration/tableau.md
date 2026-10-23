---
{
    "title": "Tableau",
    "language": "ru",
    "description": "Подключитесь к Apache Doris через официальный коннектор MySQL для Tableau и MySQL JDBC Driver для интеграции источников данных, визуального анализа и создания дашбордов.",
    "keywords": [
        "Tableau",
        "Apache Doris",
        "BI",
        "Визуализация данных",
        "MySQL JDBC",
        "Интеграция источников данных"
    ],
    "sidebar_label": "Tableau"
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenario: Connect to Apache Doris in Tableau for data visualization and dashboard development -->

# Tableau {#tableau}

[Tableau](https://www.tableau.com/) — один из ведущих инструментов бизнес-аналитики (BI) и визуализации данных. Apache Doris совместим с протоколом MySQL, поэтому к нему можно подключиться напрямую через официальный **коннектор MySQL** для Tableau (на базе MySQL JDBC Driver), без специального плагина.

Этот документ предназначен для следующих типичных сценариев:

- У вас уже есть кластер Apache Doris, и вы хотите исследовать данные и разрабатывать отчёты в Tableau.
- Вам нужно использовать детальные данные или агрегированные результаты из Doris в качестве источника данных для рабочих книг Tableau.
- Вы хотите публиковать результаты анализа данных из Doris с помощью дашбордов Tableau.

Выполнив шаги из этого документа, вы сможете:

1. Установить и настроить Tableau Desktop и драйвер MySQL JDBC в локальной среде.
2. Создать подключение к Apache Doris в Tableau в качестве источника данных.
3. Создавать диаграммы и дашборды в Tableau на основе источников данных Doris.

## Предварительные требования {#prerequisites}

Перед началом работы убедитесь, что выполнены следующие требования:

| Компонент              | Требование                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Кластер Apache Doris | Доступен, порт протокола MySQL на FE (по умолчанию `9030`) открыт                |
| Учётная запись базы данных        | Имеет право чтения целевой базы данных                                          |
| Tableau Desktop   | Установлена последняя версия ([страница загрузки](https://www.tableau.com/products/desktop/download)) |
| MySQL JDBC Driver | Версия 8.3.0 ([ссылка для скачивания](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)) |

## Шаг 1: Установка Tableau и драйвера JDBC {#step-1-install-tableau-and-the-jdbc-driver}

1. Скачайте и установите [Tableau Desktop](https://www.tableau.com/products/desktop/download).
2. Скачайте [MySQL JDBC Driver 8.3.0](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar).
3. Поместите jar-файл драйвера JDBC в каталог, предусмотренный Tableau:

    | Операционная система | Путь к драйверу                                                                  |
    | -------- | ----------------------------------------------------------------------------- |
    | macOS    | `~/Library/Tableau/Drivers`                                                   |
    | Windows  | `%tableau_path%\Drivers\` (по умолчанию `tableau_path = C:\Program Files\Tableau`) |

4. Перезапустите Tableau Desktop, чтобы драйвер стал доступен.

## Шаг 2: Настройка источника данных Apache Doris в Tableau {#step-2-configure-the-apache-doris-data-source-in-tableau}

После установки драйвера можно создать в Tableau источник данных с подключением к Doris (в примере используется база данных `tpch`).

### 1. Подготовка данных для подключения {#1-prepare-connection-information}

Для подключения к Apache Doris через JDBC требуются следующие параметры:

| Параметр               | Описание                              | Пример                              |
| ------------------ | --------------------------------- | --------------------------------- |
| Сервер             | Адрес узла FE Doris               | `127.0.0.1`                       |
| Порт               | Порт протокола MySQL на FE Doris        | `9030`                            |
| База данных           | Имя базы данных                          | `tpch`                            |
| Имя пользователя           | Имя пользователя                            | `testuser`                        |
| Пароль           | Пароль                              | (укажите пароль своей учётной записи)                   |
| Оператор SQL инициализации | SQL, автоматически выполняемый после установления подключения    | `select * from database.table`    |

### 2. Создание подключения {#2-create-the-connection}

1. Запустите Tableau Desktop. Если приложение уже запущено, перезапустите его, чтобы загрузить драйвер.
2. В меню слева, в разделе **К серверу**, нажмите **Ещё**, затем найдите **MySQL** в списке коннекторов:

    ![Поиск коннектора MySQL](/images/next/connection-integration/data-integration/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

3. Нажмите **MySQL**, чтобы открыть диалоговое окно настройки подключения:

    ![Диалоговое окно настройки подключения MySQL](/images/next/connection-integration/data-integration/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

4. Введите данные для подключения, подготовленные на предыдущем шаге, следуя подсказкам в диалоговом окне.
5. Нажмите **Войти**. После успешного подключения откроется новая рабочая книга Tableau:

    ![Рабочая книга Tableau](/images/next/connection-integration/data-integration/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

## Шаг 3: Создание визуализаций в Tableau {#step-3-build-visualizations-in-tableau}

Следующий пример на наборе данных TPC-H показывает, как создавать визуализации на основе источника данных Doris. Инструкции по подготовке данных TPC-H см. в [документации по тестированию производительности TPC-H](../../lakehouse/best-practices/tpch.md).

### 1. Соединение таблиц данных {#1-join-the-data-tables}

1. Перетащите таблицы `customer` и `orders` в рабочую книгу и укажите `Custkey` в качестве поля соединения на панели ниже:

    ![Соединение customer и orders](/images/next/connection-integration/data-integration/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)

2. Перетащите таблицу `nation` в рабочую книгу и укажите поле соединения с `customer`: `Nationkey`:

    ![Соединение nation и customer](/images/next/connection-integration/data-integration/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)

3. После соединения трёх таблиц источник данных готов к анализу. Нажмите вкладку `Sheet 1` внизу рабочей книги, чтобы перейти на рабочий лист:

    ![Переход на рабочий лист](/images/next/connection-integration/data-integration/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)

### 2. Сценарий A: Количество клиентов по годам (линейный график) {#2-scenario-a-annual-customer-count-summary-line-chart}

Перетащите `OrderDate` (из `orders`) в `Columns`, а затем `customer(count)` (из `customer`) в `Rows`. Tableau построит линейный график:

![Линейный график количества клиентов по годам](/images/next/connection-integration/data-integration/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

:::note
Набор данных TPC-H создаётся скриптом по стандартным правилам и не содержит реальных бизнес-данных. Результаты предназначены только для демонстрации возможностей и проверки подключения.
:::

### 3. Сценарий B: Средняя сумма заказа по регионам и годам {#3-scenario-b-average-order-amount-by-region-and-year}

1. Нажмите `New Worksheet`, чтобы создать новый лист.
2. Перетащите `Name` (из `nation`) в `Rows`.
3. Перетащите `OrderDate` (из `orders`) в `Columns`.

    На этом этапе в таблице отображаются значения-заполнители `Abc`, поскольку агрегируемый показатель ещё не задан.

4. Перетащите `Totalprice` (из `orders`) в центр таблицы. По умолчанию используется агрегация `SUM`:

    ![Агрегация SUM по умолчанию](/images/next/connection-integration/data-integration/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)

5. Нажмите `SUM` и в меню `Measure` выберите `Average`:

    ![Выбор Average](/images/next/connection-integration/data-integration/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)

6. В том же раскрывающемся меню выберите `Format`, затем для `Numbers` установите `Currency (Standard)`:

    ![Настройка денежного формата](/images/next/connection-integration/data-integration/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)

7. Итоговый отчёт соответствует ожидаемому результату:

    ![Итоговый отчёт](/images/next/connection-integration/data-integration/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

Теперь вы успешно подключили Tableau к Apache Doris и создали дашборды для анализа и визуализации данных.

## Рекомендации {#best-practices}

### Оптимизация производительности {#performance-optimization}

- **Тщательно проектируйте схемы таблиц**: Настраивайте партиционирование и бакетирование таблиц Doris с учётом характера запросов, чтобы сократить объём сканируемых данных и затраты на их передачу.
- **Используйте материализованные представления**: Для часто выполняемых запросов с агрегацией создавайте в Doris материализованные представления, чтобы заранее вычислять агрегаты и ускорять отклик дашбордов Tableau.
- **Выбирайте подходящее расписание обновления**: Соотносите частоту обновления с потреблением вычислительных ресурсов, чтобы поддерживать актуальность дашбордов и контролировать нагрузку на кластер.

### Настройка безопасности {#security-configuration}

- **Сетевая изоляция**: Используйте частные соединения VPC вместо прямого доступа к Doris через общедоступную сеть.
- **Контроль доступа**: С помощью групп безопасности ограничьте источники подключений к портам Doris.
- **Шифрование при передаче**: Включите зашифрованные соединения SSL/TLS.
- **Принцип наименьших привилегий**: Детально настройте роли и права пользователей Doris, чтобы избежать предоставления избыточных прав.
