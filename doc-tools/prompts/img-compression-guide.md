# Image Compression Guide

## Convert PNG to JPEG

Use this for documentation illustrations, such as diagrams and flowcharts, when the image does not rely on a solid-color or transparent background.

### Tool

Use Python PIL (Pillow):

```python
from PIL import Image
import os

files = ['xxx.png', 'yyy.png']

for f in files:
    out = f.replace('.png', '.jpg')
    img = Image.open(f).convert('RGB')
    img.save(out, 'JPEG', quality=85, optimize=True)
    orig = os.path.getsize(f) / 1024
    new = os.path.getsize(out) / 1024
    print(f"{f}: {orig:.0f}KB → {out}: {new:.0f}KB (saved {orig-new:.0f}KB)")
```

### Parameters

- `quality=85`: Keeps documentation illustrations clear while producing a reasonable file size.
- `convert('RGB')`: Removes the PNG alpha channel and converts the image to standard JPEG format.
- `optimize=True`: Enables optimized JPEG encoding to reduce the file size further.

### Compression Results (Reference)

| File | Original Size | Compressed Size | Saved |
|------|--------|--------|------|
| catalog-db-tbl.png | 2.1MB | 191KB | 91% |
| columnar-storage.png | 1.9MB | 231KB | 88% |
| mpp.png | 2.2MB | 240KB | 89% |
| partition-bucket.png | 1.5MB | 186KB | 88% |
| runtime-filter.png | 1.9MB | 265KB | 86% |

### Notes

- Images with transparent backgrounds are not good candidates for JPEG conversion because transparency becomes a white background.
- For solid-color images and screenshots, keep PNG format and compress them with tinypng.com.
