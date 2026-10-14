from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib, json

w = Path('work/m008-refinement')
loc = json.loads((w / 'production-location.json').read_text())
root = Path(loc['root'])
manifest = json.loads((root / 'package-manifest.json').read_text())
for row in manifest['files']:
    data = Path(row['path']).read_bytes()
    assert len(data) == row['bytes'], row['path']
    assert hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
source = json.loads((root / 'source-snapshot.json').read_text())['files']
for file, row in source.items():
    assert hashlib.sha256(Path(file).read_bytes()).hexdigest() == row['sha256'], file
boards = json.loads((root / 'review-boards.json').read_text())
assert boards['status'] == 'viewed' and boards['openedImages'] == 3
for row in boards['records']:
    assert hashlib.sha256((root / row['file']).read_bytes()).hexdigest() == row['sha256']

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.ids = [], set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.add(a['id'])
        for key in ('src', 'href'):
            if key in a:
                self.links.append(a[key])

page = root / 'review.html'
parsed = Links()
parsed.feed(page.read_text())
count = 0
for link in parsed.links:
    u = urlsplit(link)
    if u.scheme or u.netloc:
        continue
    dest = (page.parent / unquote(u.path)).resolve() if u.path else page.resolve()
    assert dest.exists(), link
    if u.fragment and dest.suffix == '.html':
        other = Links()
        other.feed(dest.read_text())
        assert unquote(u.fragment) in other.ids, link
    count += 1
record = {'status': 'passed', 'run': loc['run'],
          'packagePayloadFilesHashed': len(manifest['files']),
          'frozenSourceFilesUnchanged': len(source),
          'boardsOpenedAndHashed': 3, 'validLocalHTMLLinks': count}
(w / 'delivery-check.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record))
