---
{
    "title": "triggers",
    "language": "en",
    "description": "Stores all table information."
}
---

## Overview

The `triggers` table provides information about triggers.
Currently, Apache Doris supports this table for MySQL compatibility, but does not support user-defined triggers. This table is always empty.

## Database

`information_schema`

## Table Information

| Column Name | Type | Description |
|---|---|---|
| TRIGGER_CATALOG | varchar(512) | The name of the catalog to which the trigger belongs. Always 'def'. |
| TRIGGER_SCHEMA | varchar(64) | The name of the schema (database) to which the trigger belongs. |
| TRIGGER_NAME | varchar(64) | The name of the trigger. |
| EVENT_MANIPULATION | varchar(6) | The trigger event (INSERT, UPDATE, DELETE). |
| EVENT_OBJECT_CATALOG | varchar(512) | The catalog name of the table with which the trigger is associated. Always 'def'. |
| EVENT_OBJECT_SCHEMA | varchar(64) | The schema (database) name of the table with which the trigger is associated. |
| EVENT_OBJECT_TABLE | varchar(64) | The name of the table with which the trigger is associated. |
| ACTION_ORDER | bigint | The ordinal definition order of the trigger. |
| ACTION_CONDITION | varchar(512) | null |
| ACTION_STATEMENT | varchar(512) | The trigger body. |
| ACTION_ORIENTATION | varchar(9) | Always 'ROW'. |
| ACTION_TIMING | varchar(6) | Trigger timing (BEFORE, AFTER). |
| ACTION_REFERENCE_OLD_TABLE | varchar(64) | null |
| ACTION_REFERENCE_NEW_TABLE | varchar(64) | null |
| ACTION_REFERENCE_OLD_ROW | varchar(3) | Always 'OLD'. |
| ACTION_REFERENCE_NEW_ROW | varchar(3) | Always 'NEW'. |
| CREATED | datetime | The time when the trigger was created. |
| SQL_MODE | varchar(8192) | The SQL mode in effect when the trigger was created. |
| DEFINER | varchar(77) | The account that created the trigger. |
| CHARACTER_SET_CLIENT | varchar(32) | The session value of the character_set_client system variable when the trigger was created. |
| COLLATION_CONNECTION | varchar(32) | The session value of the collation_connection system variable when the trigger was created. |
| DATABASE_COLLATION | varchar(32) | The collation of the database with which the trigger is associated. |