---
{
    "title": "SHOW-CATALOGS",
    "language": "en"
}
---

## SHOW-CATALOGS

### Name

SHOW CATALOGS

### Description

This statement is used for view created catalogs

Syntax:

```sql
SHOW CATALOGS [LIKE]
```

illustrate:

1. LIKE: Fuzzy query can be performed according to the catalog name


Return result:

* CatalogId: Unique ID of the catalog
* CatalogName: Catalog name. where "internal" is the default built-in catalog, which cannot be modified.
* Type: Catalog type.
* IsCurrent: Show yes on the line of current using catalog.

### Example

1. View the data catalogs that have been created currently

   ```sql
   SHOW CATALOGS;
    +-----------+-------------+----------+-----------+
    | CatalogId | CatalogName | Type     | IsCurrent |
    +-----------+-------------+----------+-----------+
    |    130100 | hive        | hms      |           |
    |         0 | internal    | internal | yes       |
    +-----------+-------------+----------+-----------+
   	```

2. Fuzzy query by catalog name

   ```sql
   SHOW CATALOGS LIKE 'hi%';
    +-----------+-------------+----------+-----------+
    | CatalogId | CatalogName | Type     | IsCurrent |
    +-----------+-------------+----------+-----------+
    |    130100 | hive        | hms      |           |
    +-----------+-------------+----------+-----------+
       ```
   
### Keywords

SHOW, CATALOG, CATALOGS

### Best Practice

