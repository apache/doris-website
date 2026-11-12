---
{
    "title": "Data Integrity FAQ",
    "language": "en"
}
---

# Data Integrity Issues

This document is mainly used to record common data integrity issues encountered during the use of Doris. It will be updated periodically.

The term "duplicate key data in the table" refers to the appearance of duplicate key data in the merge-on-write Unique table. Duplicate key issues in merge-on-write Unique tables can be fixed by [triggering a full compaction](../admin-manual/data-admin/data-recovery), while other types of integrity issues may require specific solutions based on the situation. For assistance, please contact community support.

| Issue Description | Occurrence Conditions | Affected Versions | Fix Versions | Impacted Scope | Fix PR |
|---|---|---|---|---|---|
| Stream Load import does not delete data that meets the `delete` condition in merge-on-write Unique table | Stream Load import with `merge_type: MERGE`, `partial_columns: true`, and `delete` parameters |<2.0.15|>=2.0.15| Partial Column Update | [#40730](https://github.com/apache/doris/pull/40730) |
| Duplicate key data in the table | User adds sequence column functionality to a merge-on-write Unique table that does not support sequence columns using `ALTER TABLE tbl ENABLE FEATURE "SEQUENCE_LOAD" WITH ...`, followed by new imports | <2.0.15 | >=2.0.15 |  | [#39958](https://github.com/apache/doris/pull/39958) |
| Partial column update import results in data corruption in merge-on-write Unique table | Concurrent partial column updates in merge-on-write Unique table, with BE restart during the import process | <2.0.15 | >=2.0.15 | Partial Column Update | [#38331](https://github.com/apache/doris/pull/38331) |
| Duplicate key data in the table | Large single import in merge-on-write Unique table with sequence column triggers segment compaction | <2.0.15 | >=2.0.15 |  | [#38369](https://github.com/apache/doris/pull/38369) |
| Duplicate key data in the table | Failed full clone on merge-on-write Unique table | <2.0.13 | >=2.0.13 || [#37001](https://github.com/apache/doris/pull/37001) |
| Inconsistent multi-replica data in merge-on-write Unique table | Partial column update import with `__DORIS_DELETE_SIGN__` column on merge-on-write Unique table, and inconsistent Base Compaction progress across replicas during import | <2.0.15 | >=2.0.15 | Partial Column Update | [#36210](https://github.com/apache/doris/pull/36210) |
| Duplicate key data in the table | Concurrent partial column updates and BE restart during import on merge-on-write Unique table | <2.0.11 | >=2.0.11 | Partial Column Update | [#35739](https://github.com/apache/doris/pull/35739) |
