---
{
    "title": "Функции шифрования и маскирования",
    "language": "ru",
    "description": "Обзор встроенных функций Doris для шифрования, расшифрования, вычисления хеш-значений и маскирования данных, сгруппированных по категориям AES, SM4, MD5, SM3, SHA и маскирования."
}
---

<!-- Knowledge type: Function index -->
<!-- Applicable scenarios: Sensitive data encryption / Data masking / Hash verification -->

Doris предоставляет набор встроенных скалярных функций для **шифрования, расшифрования, вычисления хеш-значений и маскирования данных**, которые часто используются в SQL для защиты конфиденциальных полей, таких как номера телефонов, идентификационные номера и хеши паролей. На этой странице функции сгруппированы по категориям. Подробное описание синтаксиса, параметров и примеры использования каждой функции приведены на соответствующей странице руководства по SQL.

## Сценарии применения {#applicable-scenarios}

| Сценарий | Рекомендуемая функция |
| --- | --- |
| Симметричное шифрование и расшифрование конфиденциальных полей (международный алгоритм) | [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) / [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) |
| Симметричное шифрование и расшифрование конфиденциальных полей (национальный алгоритм Китая) | [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) / [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) |
| Генерация необратимых хеш-значений (например, для хранения паролей или проверки данных) | [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5), [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum), [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3), [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum), [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha), [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) |
| Маскирование полей, таких как номера телефонов и идентификационные номера, в результатах запроса | [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) |

## Категории функций {#function-categories}

<!-- Knowledge type: Function category index -->

Ниже перечислены все встроенные функции шифрования и маскирования, сгруппированные по семействам алгоритмов.

### Функции симметричного шифрования {#symmetric-encryption-functions}

Используются для обратимого шифрования и расшифрования значений полей.

| Функция | Семейство алгоритмов | Описание |
| --- | --- | --- |
| [AES_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt) | AES (международный стандарт) | Шифрование AES |
| [AES_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt) | AES (международный стандарт) | Расшифрование AES |
| [SM4_ENCRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt) | SM4 (национальный стандарт Китая) | Шифрование SM4 |
| [SM4_DECRYPT](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt) | SM4 (национальный стандарт Китая) | Расшифрование SM4 |

### Функции вычисления хеш-значений {#hash-digest-functions}

Используются для генерации необратимых хеш-значений фиксированной длины, обычно для хранения паролей и проверки целостности данных.

| Функция | Семейство алгоритмов | Описание |
| --- | --- | --- |
| [MD5](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5) | MD5 | Вычисление хеш-значения MD5 |
| [MD5SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum) | MD5 | Вычисление контрольной суммы MD5 |
| [SM3](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3) | SM3 (национальный стандарт Китая) | Вычисление хеш-значения SM3 |
| [SM3SUM](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum) | SM3 (национальный стандарт Китая) | Вычисление контрольной суммы SM3 |
| [SHA](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha) | SHA | Вычисление хеш-значения SHA |
| [SHA2](../../sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2) | SHA-2 | Вычисление хеш-значения SHA-2 |

### Функции маскирования данных {#data-masking-functions}

Используются для отображения конфиденциальных полей с маскированием в результатах запроса.

| Функция | Описание |
| --- | --- |
| [DIGITAL_MASKING](../../sql-manual/sql-functions/scalar-functions/string-functions/digital-masking) | Маскирование числовых строк, таких как номера телефонов и банковских карт |
