---
{
    "title": "Kettle",
    "language": "ru",
    "description": "Узнайте, как установить и настроить Kettle Doris Plugin в Kettle и синхронизировать данные из внешних источников с Apache Doris через Stream Load.",
    "keywords": [
        "Kettle Doris Plugin",
        "Импорт из Kettle в Doris",
        "Stream Load",
        "Синхронизация данных с Doris"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Data integration / Writing external data sources to Doris through Kettle -->

Kettle Doris Plugin представляет собой плагин для Kettle, который записывает данные из других источников в Doris через Stream Load.

Этот плагин использует функцию Stream Load в Doris для загрузки данных и должен работать совместно с сервисом Kettle. Если вы уже используете Kettle для организации ETL-заданий и хотите записывать в Doris данные из источников, поддерживаемых Kettle, этот плагин позволит синхронизировать данные.

## О Kettle {#about-kettle}

[Kettle](https://pentaho.com/) представляет собой инструмент ETL (извлечение, преобразование и загрузка) с открытым исходным кодом, первоначально разработанный компанией Pentaho. Kettle входит в число основных компонентов набора продуктов Pentaho и используется преимущественно для интеграции и обработки данных. Он позволяет извлекать данные из различных источников, очищать и преобразовывать их, а затем загружать в целевые системы.

Дополнительные сведения см. на [официальном сайте Pentaho](https://pentaho.com/).

## Порядок работы {#workflow}

Запись данных в Doris с помощью Kettle Doris Plugin выполняется в следующем порядке:

| Шаг | Цель пользователя | Действие |
| --- | --- | --- |
| 1 | Подготовить среду Kettle | Скачайте и распакуйте Kettle или соберите его самостоятельно. |
| 2 | Подготовить плагин Doris | Соберите Kettle Doris Plugin из исходного кода Doris. |
| 3 | Установить плагин | Скопируйте собранный плагин `doris-stream-loader` в каталог `plugins` Kettle. |
| 4 | Создать задание | Выберите Doris Stream Loader в Kettle и настройте подключение к Doris и параметры импорта. |
| 5 | Запустить синхронизацию | Запустите задание для записи данных в Doris через Stream Load. |

## Подготовка среды Kettle {#prepare-the-kettle-environment}

### Скачивание и запуск Kettle {#download-and-start-kettle}

1. Перейдите на [страницу загрузки Kettle](https://pentaho.com/download/#download-pentaho) и скачайте Kettle.
2. Распакуйте скачанный пакет.
3. Выполните `spoon.sh`, чтобы запустить Kettle.

### Самостоятельная сборка Kettle {#build-kettle-yourself}

Чтобы собрать Kettle самостоятельно, следуйте [инструкциям по сборке Pentaho Kettle](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build).

## Сборка и установка Kettle Doris Plugin {#build-and-install-the-kettle-doris-plugin}

### Сборка плагина {#build-the-plugin}

В каталоге исходного кода Doris перейдите в `extension/kettle`, затем соберите плагин:

```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```

### Установка плагина {#install-the-plugin}

После завершения сборки распакуйте пакет плагина и скопируйте `doris-stream-loader` в каталог `plugins` Kettle:

```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
```

## Создание и запуск задания {#build-and-run-a-job}

### Создание задания Doris Stream Loader {#build-a-doris-stream-loader-job}

В Kettle найдите Doris Stream Loader в разделе «Массовая загрузка» и создайте задание.

![Создание задания Doris Stream Loader в Kettle](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create.png)

### Запуск задания {#run-the-job}

Нажмите «Запустить», чтобы выполнить задание и синхронизировать данные.

![Запуск задания Doris Stream Loader в Kettle](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running.png)

## Параметры {#parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Kettle Doris Plugin job configuration -->

В следующей таблице описаны основные параметры настройки задания Doris Stream Loader:

| Параметр | Значение по умолчанию | Обязательный | Описание |
| --- | --- | --- | --- |
| `Step name` | -- | Y | Название шага. |
| `fenodes` | -- | Y | HTTP-адрес FE Doris. Поддерживается несколько адресов, разделённых запятыми. |
| База данных | -- | Y | Целевая база данных в Doris для записи. |
| Целевая таблица | -- | Y | Целевая таблица в Doris для записи. |
| Имя пользователя | -- | Y | Имя пользователя для доступа к Doris. |
| Пароль | -- | N | Пароль для доступа к Doris. |
| Максимальное число строк за один импорт | 10000 | N | Максимальное число строк за один импорт. |
| Максимальное число байтов за один импорт | 10485760 (10 MB) | N | Максимальный объём данных в байтах за один импорт. |
| Число повторных попыток импорта | 3 | N | Число повторных попыток при сбое импорта. |
| Свойства Stream Load | -- | N | Заголовки запроса Stream Load. |
| Режим удаления | N | N | Определяет, включён ли режим удаления. По умолчанию Stream Load выполняет операции вставки. После включения режима удаления все операции записи Stream Load становятся операциями удаления. |

Дополнительные параметры Stream Load см. в [документации по Stream Load](../../data-operate/import/import-way/stream-load-manual.md).

## Часто задаваемые вопросы {#faq}

### Можно ли использовать Kettle Doris Plugin самостоятельно? {#can-the-kettle-doris-plugin-be-used-on-its-own}

Нет. Kettle Doris Plugin должен работать совместно с сервисом Kettle.

### Как заполнить `fenodes`? {#how-should-fenodes-be-filled-in}

Укажите в `fenodes` HTTP-адрес FE Doris. Если адресов FE несколько, разделите их запятыми.

### Как режим удаления влияет на запись? {#how-does-delete-mode-affect-writes}

По умолчанию Stream Load выполняет операции вставки. После включения режима удаления все операции записи Stream Load становятся операциями удаления.
