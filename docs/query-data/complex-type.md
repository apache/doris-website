---
{
    "title": "Complex Type Queries",
    "language": "en",
    "description": "Learn how to query complex types such as Array, Map, Struct, and JSON in Apache Doris, and process semi-structured data with dedicated SQL functions.",
    "keywords": [
        "Doris complex types",
        "Array queries",
        "Map queries",
        "Struct queries",
        "JSON queries",
        "semi-structured data",
        "complex type functions"
    ]
}
---

<!-- Knowledge type: Capability overview / Function index -->
<!-- Applicable scenarios: Semi-structured data queries / Nested field access -->

In scenarios such as logs, event tracking, user profiles, and order details, business data is rarely a flat relational structure. It is naturally nested or semi-structured. Apache Doris supports complex types such as Array, Map, Struct, and JSON, so this kind of data can be stored in its original structure and queried or computed with dedicated functions.

## Applicable Scenarios

Complex types are suitable for the following query scenarios:

- List-style fields, such as tags, categories, or multi-valued product attributes, that need to be expressed with **Array**.
- Dictionary-style fields, such as configurations or attribute key-value pairs, that need to be expressed with **Map**.
- Structured records, such as nested objects or composite fields, that need to be expressed with **Struct**.
- **JSON** semi-structured data from upstream systems with non-fixed schemas.

## Complex Type Function Index

For the complex types above, Doris provides corresponding sets of SQL functions that you can use directly in queries. For detailed function descriptions, see the SQL Functions chapter in the SQL Manual:

| Complex type | Function documentation |
| --- | --- |
| Array | [Array functions](../sql-manual/sql-functions/scalar-functions/array-functions/array) |
| Map | [Map functions](../sql-manual/basic-element/sql-data-types/semi-structured/MAP) |
| Struct | [Struct functions](../sql-manual/sql-functions/scalar-functions/struct-functions/struct) |
| JSON | [JSON functions](../sql-manual/sql-functions/scalar-functions/json-functions/json-parse) |
