---
{
    "title": "SHOW STORAGE VAULTS",
    "language": "ru",
    "description": "Команда SHOW STORAGE VAULTS используется для отображения информации обо всех хранилищах, настроенных в системе."
}
---

## Описание {#description}

Команда SHOW STORAGE VAULTS используется для отображения информации обо всех хранилищах, настроенных в системе. Хранилища используются для управления внешними местами хранения данных.

## Синтаксис {#syntax}

```sql
    SHOW STORAGE VAULTS
```

## Возвращаемые значения {#return-values}

Эта команда возвращает набор результатов со следующими столбцами:

- `StorageVaultName`: Имя хранилища.
- `StorageVaultId`: Идентификатор хранилища.
- `Properties`: Строка JSON с параметрами конфигурации хранилища.
- `IsDefault`: Указывает, задано ли это хранилище в качестве хранилища по умолчанию (TRUE или FALSE).

## Связанные команды {#related-commands}

- [CREATE STORAGE VAULT](./CREATE-STORAGE-VAULT)
- [GRANT](../../account-management/GRANT-TO)
- [REVOKE](../../account-management/REVOKE-FROM)
- [SET DEFAULT STORAGE VAULT](./SET-DEFAULT-STORAGE-VAULT)

## Ключевые слова {#keywords}

    SHOW, STORAGE VAULTS
