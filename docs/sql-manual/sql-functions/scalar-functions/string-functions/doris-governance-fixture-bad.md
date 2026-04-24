---
title: "doris_governance_fixture_bad"
description: "Fixture SQL function documentation with intentionally broken structure to trigger the SQL function governance lint rules."
---

# doris_governance_fixture_bad

## Syntax

```sql
doris_governance_fixture_bad(expr)
```

```python
# extra code block in Syntax section to violate sql-function-syntax-sql-code-block
print("bad")
```

## Description

Intentionally placed after Syntax, violating sql-function-section-order.

## Parameters

Parameters are described as a bullet list to violate sql-function-parameters-table:

- `expr`: some expression.

## Return Value

Returns something useful.

## Example

```sql
SELECT doris_governance_fixture_bad('x');
```

No expected `text` output block is provided, so sql-function-example-output
should fire here.
