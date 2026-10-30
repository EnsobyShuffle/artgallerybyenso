#!/usr/bin/env python3
"""Audit and package only public gallery assets. Does not upload or create resources."""
import argparse
import hashlib
import json
import re
import shutil
import zipfile
from collections import Counter
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build' / 'cloudbase'

class Dependencies(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src'):
            self.items.append(('script', attrs['src']))
        if tag == 'link' and attrs.get('href'):
            self.items.append((attrs.get('rel', 'link'), attrs['href']))

def read_gallery():
    html = (ROOT / 'index.html').read_text()
    match = re.search(r'<script[^>]*id="galleryData"[^>]*>(.*?)</script>', html, re.S)
    if not match:
        raise ValueError('galleryData not found')
    data = json.loads(match.group(1))
    for name in ('impressionism.js', 'renaissance.js'):
        content = (ROOT / name).read_text()
        extension = json.loads(content.split('=', 1)[1].rstrip('; \r\n'))
        data['artists'].update(extension['artists'])
        ids = {p['id'] for p in data['pieces']}
        data['pieces'].extend(p for p in extension['pieces'] if p['id'] not in ids)
    return html, data

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--release', action='store_true', help='Fail if external runtime media remain')
    args = parser.parse_args()
    html, data = read_gallery()
    refs = []
    for key, artist in data['artists'].items():
        if artist.get('cover'):
            refs.append({'owner': key, 'field': 'cover', 'url': artist['cover'], 'rights': 'See artwork and artist records'})
    for piece in data['pieces']:
        for field in ('image', 'originalImage'):
            if piece.get(field):
                refs.append({'owner': piece['id'], 'field': field, 'url': piece[field], 'rights': piece.get('rights', 'not verified'), 'rightsSource': piece.get('rightsSource', '')})
    dependencies = Dependencies()
    dependencies.feed(html)
    for kind, url in dependencies.items:
        refs.append({'owner': 'document', 'field': kind, 'url': url})
    external, missing = [], []
    for ref in refs:
        parsed = urlparse(ref['url'])
        if parsed.netloc:
            ref['host'] = parsed.netloc
            external.append(ref)
        elif parsed.scheme not in ('data', 'blob'):
            local = (ROOT / unquote(parsed.path).lstrip('/')).resolve()
            if not local.is_relative_to(ROOT) or not local.is_file():
                missing.append(ref)
    artist_counts = Counter(p['artist'] for p in data['pieces'])
    report = {
        'generatedAt': datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(),
        'source': 'EnsobyShuffle/artgallerybyenso',
        'status': 'prepared_not_deployed',
        'artistCount': len(data['artists']), 'artworkCount': len(data['pieces']),
        'artworksByArtist': dict(artist_counts),
        'localArtworkCount': sum(1 for p in data['pieces'] if p.get('image', '').startswith('/assets/')),
        'externalRuntimeReferenceCount': len(external),
        'externalRuntimeUniqueUrls': len({r['url'] for r in external}),
        'externalHosts': dict(Counter(r['host'] for r in external).most_common()),
        'missingLocalReferences': missing,
        'externalRuntimeReferences': external,
        'mainlandNetworkVerified': False,
        'notes': ['Source and research hyperlinks are not automatic runtime dependencies.',
                  'External references are migration work items, not proof every source is blocked.',
                  'Browser favorites and notes belong to their original origin; export before switching domain.',
                  'Image rights must be checked before copying third-party images.'],
    }
    reports = ROOT / 'research'
    reports.mkdir(exist_ok=True)
    (reports / 'mainland-migration-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    if missing:
        raise SystemExit(f'Missing {len(missing)} local dependencies; no package produced')
    if args.release and external:
        raise SystemExit(f'Release blocked: {len(external)} external runtime references still need remediation')
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    allowed = ['index.html', 'impressionism.js', 'renaissance.js', 'favicon.svg',
               'manifest.webmanifest', 'personal-data.html', 'personal-data.js', 'personal-data-core.js']
    files = [ROOT / name for name in allowed]
    files += sorted(p for p in (ROOT / 'assets').rglob('*') if p.is_file() and p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.svg', '.woff2'))
    manifest = []
    for src in files:
        rel = src.relative_to(ROOT)
        if src.is_symlink() or src.suffix.lower() not in ('.html', '.js', '.css', '.svg', '.jpg', '.jpeg', '.png', '.webp', '.woff2', '.webmanifest'):
            raise ValueError(f'Not an approved public asset: {rel}')
        dest = OUT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest)
        raw = src.read_bytes()
        manifest.append({'path': rel.as_posix(), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
    (ROOT / 'build' / 'cloudbase-files.json').write_text(json.dumps(manifest, indent=2)+'\n')
    archive = ROOT / 'build' / 'artgallery-cloudbase-preview.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for src in sorted(OUT.rglob('*')):
            if src.is_file():
                z.write(src, src.relative_to(OUT))
    print(json.dumps({k:report[k] for k in ('artistCount','artworkCount','localArtworkCount','externalRuntimeReferenceCount','externalRuntimeUniqueUrls','externalHosts')}, ensure_ascii=False))
    print(json.dumps({'packageFiles':len(manifest),'publicBytes':sum(f['bytes'] for f in manifest),'archive':str(archive),'productionReady':False}))

if __name__ == '__main__':
    main()
