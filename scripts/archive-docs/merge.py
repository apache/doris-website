"""Merge print batches, restore cross-batch links and add document bookmarks."""
import json
import sys
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject, DecodedStreamObject, DictionaryObject, FloatObject,
    NameObject, NumberObject,
)

job = json.loads(Path(sys.argv[1]).read_text())
writer = PdfWriter()
for batch in job['batches']:
    writer.append(PdfReader(batch), import_outline=False)

prefix = 'https://archive.invalid/'
targets = {'contents': (1, 40, 800)}
for index, page in enumerate(writer.pages):
    for ref in page.get('/Annots', []):
        link = ref.get_object()
        uri = str(link.get('/A', {}).get('/URI', ''))
        if uri.startswith(prefix + 'start/'):
            rect = link['/Rect']
            targets[uri[len(prefix + 'start/'):]] = (index, float(rect[0]), float(rect[3]))

for page in writer.pages:
    for ref in page.get('/Annots', []):
        link = ref.get_object()
        uri = str(link.get('/A', {}).get('/URI', ''))
        if not uri.startswith(prefix):
            continue
        key = uri[len(prefix):].removeprefix('start/')
        target = targets.get(key) or targets.get(key.split('#')[0])
        if target is None:
            raise RuntimeError(f'Unresolved internal PDF link: {key}')
        destination = ArrayObject([writer.pages[target[0]].indirect_reference,
                                   NameObject('/XYZ'), FloatObject(target[1]),
                                   FloatObject(target[2]), NumberObject(0)])
        link[NameObject('/A')] = DictionaryObject({NameObject('/S'): NameObject('/GoTo'),
                                                   NameObject('/D'): destination})

missing = [doc['key'] for doc in job['docs'] if doc['key'] not in targets]
if missing:
    raise RuntimeError(f'Missing document headings: {missing}')
writer.add_outline_item(job['contentsTitle'], 1)
for doc in job['docs']:
    writer.add_outline_item(doc['title'], targets[doc['key']][0])
writer.add_metadata({'/Title': job['title'], '/Author': 'Apache Doris',
                     '/Subject': f"Archived documentation, source commit {job['commit']}",
                     '/Keywords': f"Apache Doris,{job['version']},{job['locale']},archive"})
font = writer._add_object(DictionaryObject({NameObject('/Type'): NameObject('/Font'),
    NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')}))
for index in range(1, len(writer.pages)):
    page = writer.pages[index]
    resources = page['/Resources'].get_object()
    if '/Font' not in resources:
        resources[NameObject('/Font')] = DictionaryObject()
    resources['/Font'][NameObject('/ArchiveFooter')] = font
    stream = DecodedStreamObject()
    stream.set_data(f'\nQ\nq BT /ArchiveFooter 8 Tf 0.3 0.35 0.32 rg 1 0 0 1 495 22 Tm ({index + 1} / {len(writer.pages)}) Tj ET Q\n'.encode('ascii'))
    old = page.get('/Contents')
    contents = old.get_object() if old is not None else None
    values = list(contents) if isinstance(contents, ArrayObject) else ([old] if old is not None else [])
    start = DecodedStreamObject()
    start.set_data(b'q\n')
    page[NameObject('/Contents')] = ArrayObject([writer._add_object(start)] + values + [writer._add_object(stream)])
writer.write(job['output'])
print(json.dumps({'pages': len(writer.pages), 'documents': len(job['docs']), 'bookmarks': len(job['docs']) + 1}))
