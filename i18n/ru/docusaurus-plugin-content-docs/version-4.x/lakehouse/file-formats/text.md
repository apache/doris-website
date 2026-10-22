---
{
    "title": "Text/CSV/JSON",
    "language": "ru",
    "description": "В этом документе описана поддержка чтения и записи текстовых файлов различных форматов в Doris."
}
---

В этом документе описана поддержка чтения и записи текстовых файлов различных форматов в Doris.

## Text/CSV {#textcsv}

* Catalog

  Поддерживается чтение таблиц Hive в формате `org.apache.hadoop.mapred.TextInputFormat`.

  Поддерживаются следующие SerDe:

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (начиная с версии 2.1.7)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (начиная с версии 3.1.0)  

* Табличная функция

* Импорт

  Функция импорта поддерживает форматы Text/CSV. Подробности см. в документации по импорту.

* Экспорт

  Функция экспорта поддерживает форматы Text/CSV. Подробности см. в документации по экспорту.

### Поддерживаемые форматы сжатия {#supported-compression-formats}

* без сжатия
* gzip
* deflate
* bzip2
* zstd
* lz4
* snappy
* lzo

## JSON {#json}

### Catalog {#catalog}

- `org.apache.hadoop.hive.serde2.JsonSerDe` (начиная с версии 3.0.4)

- `org.apache.hive.hcatalog.data.JsonSerDe` (начиная с версии 3.0.4)

  1. Поддерживаются как примитивные, так и сложные типы.
  2. Свойство `timestamp.formats` в SERDEPROPERTIES не поддерживается.

- Таблица Hive в формате [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde) (начиная с версии 3.0.6)

  1. Поддерживаются как примитивные, так и сложные типы.
  2. SERDEPROPERTIES: поддерживается только [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data), поведение которого соответствует поведению в этом JsonSerDe. Остальные SERDEPROPERTIES не действуют.
  3. Не поддерживается [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays) (аналогично формату Text/CSV, где данные всех столбцов помещаются в один массив).
  4. Не поддерживается [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array) (преобразование скалярного значения в массив из одного элемента).
  5. По умолчанию Doris корректно определяет схему таблицы. Однако из-за отсутствия поддержки некоторых параметров автоматическое определение схемы может завершиться неудачей. В этом случае можно установить `read_hive_json_in_one_column = true`, чтобы поместить всю строку JSON в первый столбец и обеспечить полное чтение исходных данных. Затем пользователи могут обработать их вручную. Для использования этой возможности первый столбец должен иметь тип данных `String`.

### Импорт {#import}

Функция импорта поддерживает форматы JSON. Подробности см. в документации по импорту.

## Набор символов {#character-set}

В настоящее время Doris поддерживает только кодировку UTF-8. Однако некоторые данные, например данные в таблицах Hive в формате Text, могут содержать текст в кодировке, отличной от UTF-8. Это приводит к сбоям при чтении и следующей ошибке:

```text
Only support csv data in utf8 codec
```

В этом случае можно установить переменную сеанса следующим образом:

```text
SET enable_text_validate_utf8 = false
```

Это отключит проверку кодировки UTF-8 и позволит прочитать такие данные. Обратите внимание: этот параметр лишь пропускает проверку, а содержимое в кодировке, отличной от UTF-8, по-прежнему будет отображаться как нечитаемый текст.

Этот параметр поддерживается начиная с версии 3.0.4.
