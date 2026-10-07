from pathlib import Path
import json,hashlib,sys
root=Path.cwd();files=sorted(p for directory in ['src','scripts','tests']for p in (root/directory).rglob('*')if p.is_file() and p.suffix in ['.ts','.tsx','.js','.py','.json'])
out=root/'work/environment-furniture'/('validation-source-snapshot'+('-final'if '--final'in sys.argv else'')+'.json');out.write_text(json.dumps({str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest()for p in files},indent=2)+'\n');print('Frozen',len(files),'source/test/script files')
