---
{
    "title": "Modify BE VLOG",
    "language": "en"
}
---

## Request

`POST /api/glog/adjust?module=<module_name>&level=<level_number>`

## Description

This function is used to dynamically adjust the VLOG log on the BE side.

## Query parameters

* `module_name`
    Module to set up VLOG, corresponding to BE without suffix filename

* `level_number`
    VLOG level, from 1 to 10. And -1 for off

## Request body

None

## Response

    ```json
    {
        msg: "adjust vlog of xxx from -1 to 10 succeed",
        code: 0
    }
    ```

## Examples

    ```bash
    curl -X POST "http://127.0.0.1:8040/api/glog/adjust?module=vrow_distribution&level=-1"
    ```
