---
{
    "title": "Alias Function",
    "language": "en",
    "description": "Apache Doris alias function guide: register a new signature for a function or expression fragment to improve compatibility when migrating from heterogeneous systems and to simplify complex queries.",
    "keywords": [
        "Doris alias function",
        "Alias Function",
        "CREATE ALIAS FUNCTION",
        "SQL function compatibility",
        "user-defined function",
        "query simplification",
        "database migration"
    ]
}
---

<!-- Knowledge type: Capability definition / Use cases -->
<!-- Applicable scenarios: Heterogeneous database migration / Complex query simplification -->

An alias function registers a new signature for an existing function or expression fragment so that you can call it under a different name. With alias functions, you can mask function-name differences when migrating queries from heterogeneous databases, and you can also wrap a complex expression fragment into a concise function call.

## Concept

An alias function is essentially a new signature registered in the system for a function or expression fragment. Calling the alias is equivalent to calling the underlying expression that it points to.

Like other user-defined functions, alias functions support two scopes:

| Scope | Registration range | How to call |
| --- | --- | --- |
| `LOCAL` | Current database | To call from another database, use the fully qualified name `<database name>.<function name>` |
| `GLOBAL` | Global | Can be accessed directly by function name from any database |

## Use Cases

<!-- Knowledge type: Use cases -->

### Scenario 1: Aliasing functions during heterogeneous database migration

During a system migration, the queries you already have may come from another database system. These queries often contain functions that behave the same as a Doris function but use a different name.

By defining an alias function in Doris that has the same name as the function in the original database, you can complete the migration transparently to the user, without rewriting each SQL statement one by one.

### Scenario 2: Simplifying complex queries

In complex analytical scenarios, the same statement or different statements often contain a large number of repeated expression fragments.

By creating an alias function for such a complex expression, you can:

- Simplify how queries are written.
- Improve the readability and maintainability of SQL.
- Reduce the maintenance cost caused by inconsistencies among repeated expressions.

## Supported Scope

<!-- Knowledge type: Constraints and limitations -->

### Expression requirements

The root node of the underlying expression that an alias function points to must currently be a function expression.

Valid examples:

```sql
-- Create an alias function named func with parameters INT, INT. The underlying expression is abs(foo + bar).
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS abs(foo + bar);

-- Create an alias function named func with parameters DATETIMEV2(3), INT. The underlying expression is date_trunc(days_sub(foo, bar), 'day').
CREATE ALIAS FUNCTION func(DATETIMEV2(3), INT) WITH PARAMETER (foo, bar) AS date_trunc(days_sub(foo, bar), 'day');
```

Invalid example:

```sql
-- The root expression is not a function but an arithmetic operator.
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS foo + bar;
```

### Parameter requirements

Parameters of an alias function must currently meet the following two conditions:

- Variable-length parameters are not supported.
- At least one parameter is required.
