---
{
    "title": "QuickSight",
    "language": "ru",
    "description": "Подключите Apache Doris к Amazon QuickSight через источник данных MySQL, настройте набор данных в режиме прямого запроса и создайте панель визуализации на основе данных TPC-H.",
    "keywords": [
        "Подключение QuickSight к Doris",
        "Amazon QuickSight Apache Doris",
        "Визуальный анализ данных Doris",
        "Прямой запрос QuickSight"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: BI tool integration / Visualization analysis -->

QuickSight может подключаться к Apache Doris через официальный источник данных MySQL и поддерживает режимы **Прямой запрос** и **Импорт**. Этот документ предназначен для пользователей, которые хотят анализировать данные Doris в QuickSight. В нем описаны подготовка к подключению, создание наборов данных и процесс построения панели визуализации со связями между несколькими таблицами на основе данных TPC-H.

## Сценарии использования {#applicable-scenarios}

| Сценарий | Цель пользователя | Результат |
| --- | --- | --- |
| Подключение к источнику данных Doris | Подключить Apache Doris к QuickSight через официальный источник данных MySQL | QuickSight получает доступ к данным в кластере Doris |
| Создание набора данных для анализа | Создать набор данных QuickSight на основе таблицы Doris | Набор данных можно использовать для дальнейшего анализа и визуализации |
| Создание панели со связями между несколькими таблицами | Использовать таблицы TPC-H `customer`, `nation` и `orders` для совместного анализа | Создается панель, показывающая количество заказов по странам и статусам заказов |

## Порядок действий {#workflow}

| Этап | Цель | Описание |
| --- | --- | --- |
| Шаг 1 | Подготовиться к подключению | Проверить версию Doris, сетевую доступность и версию совместимости с MySQL |
| Шаг 2 | Создать источник данных QuickSight | Использовать официальный коннектор MySQL в QuickSight для подключения к Apache Doris |
| Шаг 3 | Создать набор данных | Выбрать таблицу Doris и создать набор данных в режиме **Прямой запрос** |
| Шаг 4 | Создать панель визуализации | Добавить несколько наборов данных, настроить связи между таблицами и опубликовать аналитическую панель |

## Предварительные требования {#prerequisites}

Перед настройкой убедитесь, что выполнены следующие условия:

| Требование | Описание |
| --- | --- |
| Версия Doris | Apache Doris версии 3.1.2 или новее |
| Сетевая доступность | Настройте VPC и группы безопасности в соответствии со средой развертывания Doris, чтобы сервер AWS мог обращаться к кластеру Doris |
| Версия совместимости с MySQL | Задайте версию совместимости с MySQL через клиент MySQL, подключенный к Doris |

В клиенте MySQL, подключенном к Doris, выполните следующий SQL, чтобы задать версию совместимости с MySQL:

```sql
SET GLOBAL version = '8.3.99';
```

Выполните следующий SQL, чтобы проверить настройку:

```sql
mysql> show variables like "version";
+---------------+--------+---------------+---------+
| Variable_name | Value  | Default_Value | Changed |
+---------------+--------+---------------+---------+
| version       | 8.3.99 | 5.7.99        | 1       |
+---------------+--------+---------------+---------+
1 row in set (0.01 sec)
```

## Подключение QuickSight к Apache Doris {#connect-quicksight-to-apache-doris}

В этом разделе описано, как создать источник данных Doris в QuickSight и набор данных на основе таблицы Doris.

### Шаг 1: Создайте новый набор данных QuickSight {#step-1-create-a-new-quicksight-dataset}

Перейдите в [консоль QuickSight](https://quicksight.aws.amazon.com/), откройте страницу наборов данных и нажмите **Новый набор данных**.

![Откройте страницу наборов данных QuickSight](/images/next/connection-integration/data-integration/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![Создайте новый набор данных QuickSight](/images/next/connection-integration/data-integration/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

### Шаг 2: Выберите коннектор MySQL {#step-2-select-the-mysql-connector}

Найдите и выберите официальный коннектор MySQL, встроенный в QuickSight.

![Выберите коннектор MySQL в QuickSight](/images/next/connection-integration/data-integration/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

### Шаг 3: Укажите параметры подключения к Doris {#step-3-fill-in-the-doris-connection-information}

Укажите параметры подключения к Doris в соответствующих полях на странице. По умолчанию порт интерфейса MySQL — `9030`. Фактический порт определяется параметром `query_port` в конфигурации FE Doris.

![Укажите параметры подключения к Doris](/images/next/connection-integration/data-integration/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

### Шаг 4: Выберите таблицу Doris и режим запроса {#step-4-select-the-doris-table-and-query-mode}

Выберите из списка таблицу Doris, которую хотите анализировать.

![Выберите таблицу Doris](/images/next/connection-integration/data-integration/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

Рекомендуется выбрать режим **Прямой запрос**.

![Выберите режим прямого запроса](/images/next/connection-integration/data-integration/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

После нажатия **Редактировать/просмотреть данные** вы сможете просмотреть схему таблицы, настроить собственный SQL-запрос и изменить набор данных.

![Просмотрите и отредактируйте набор данных QuickSight](/images/next/connection-integration/data-integration/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

### Шаг 5: Опубликуйте набор данных и создайте визуализацию {#step-5-publish-the-dataset-and-create-a-visualization}

После завершения настройки можно опубликовать набор данных и создать новую визуализацию.

![Опубликуйте набор данных QuickSight](/images/next/connection-integration/data-integration/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## Создание визуализации в QuickSight {#build-a-visualization-in-quicksight}

В этом разделе на примере данных TPC-H показано, как создать в QuickSight панель визуализации со связями между несколькими таблицами. Инструкции по созданию источника данных TPC-H в Doris приведены в [документации по бенчмарку TPC-H](../../lakehouse/best-practices/tpch.md).

Цель примера — подсчитать количество заказов для каждой страны с разбивкой по статусам заказов. Поскольку Doris обеспечивает высокую производительность запросов со связями между несколькими таблицами, в этом документе для совместного анализа используются таблицы `customer`, `nation` и `orders`.

### Шаг 1: Создайте набор данных на основе таблицы Doris {#step-1-create-a-dataset-based-on-a-doris-table}

1. Используйте созданный ранее источник данных, чтобы добавить следующие таблицы в качестве наборов данных:

    - `customer`
    - `nation`
    - `orders`

2. Нажмите **Создать набор данных**.

    ![Создайте набор данных QuickSight](/images/next/connection-integration/data-integration/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. Выберите созданный ранее источник данных.

    ![Выберите созданный ранее источник данных](/images/next/connection-integration/data-integration/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. Выберите нужную таблицу.

    ![Выберите таблицу для анализа](/images/next/connection-integration/data-integration/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

5. Выберите режим **Прямой запрос**.

    ![Выберите режим прямого запроса для набора данных](/images/next/connection-integration/data-integration/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

6. Нажмите **Визуализировать**, чтобы создать источник данных, затем повторите эти действия для остальных таблиц.

### Шаг 2: Добавьте несколько наборов данных в анализ {#step-2-add-multiple-datasets-to-the-analysis}

1. Откройте рабочую область создания панели, нажмите раскрывающийся список текущего набора данных и выберите **Добавить новый набор данных**.

    ![Добавьте новый набор данных в анализ](/images/next/connection-integration/data-integration/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

2. Выберите все наборы данных, которые хотите использовать, и нажмите **Выбрать**, чтобы добавить их на текущую панель.

    ![Выберите несколько наборов данных](/images/next/connection-integration/data-integration/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

### Шаг 3: Настройте связи между наборами данных {#step-3-configure-dataset-associations}

1. После добавления наборов данных нажмите пункт действий для `nation`, чтобы открыть интерфейс редактирования набора данных.

    ![Откройте интерфейс редактирования набора данных nation](/images/next/connection-integration/data-integration/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

2. Нажмите **Добавить данные**, чтобы добавить источник данных.

    ![Добавьте источник данных в набор данных](/images/next/connection-integration/data-integration/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

3. После добавления всех трех таблиц настройте ключи связи. Связи должны быть следующими:

    | Левая таблица | Левое поле | Правая таблица | Правое поле |
    | --- | --- | --- | --- |
    | `customer` | `c_nationkey` | `nation` | `n_nationkey` |
    | `customer` | `c_custkey` | `orders` | `o_custkey` |

    ![Настройте связи между тремя таблицами](/images/next/connection-integration/data-integration/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

4. После настройки связей нажмите **Сохранить и опубликовать** в правом верхнем углу для публикации.

    ![Опубликуйте набор данных со связанными таблицами](/images/next/connection-integration/data-integration/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

### Шаг 4: Настройте диаграммы и опубликуйте панель {#step-4-configure-charts-and-publish-the-dashboard}

1. Вернитесь в раздел **Анализы**, куда были добавлены три источника данных, и нажмите `n_name`, чтобы создать диаграмму с общим количеством заказов по названиям стран.

    ![Подсчитайте общее количество заказов по названиям стран](/images/next/connection-integration/data-integration/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

2. Выберите `o_orderkey` в поле **ЗНАЧЕНИЕ** и `o_orderstatus` в поле **ГРУППА/ЦВЕТ**, чтобы получить панель с количеством заказов по странам и статусам заказов.

    ![Подсчитайте количество заказов по странам и статусам заказов](/images/next/connection-integration/data-integration/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

3. Нажмите **Опубликовать** в правом верхнем углу, чтобы завершить публикацию панели.

## Результат {#result}

Вы успешно подключили QuickSight к Apache Doris и создали панели для анализа и визуализации данных.
