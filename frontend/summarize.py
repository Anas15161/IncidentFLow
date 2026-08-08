import re

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    line = line.strip()
    if line.startswith('// ') and len(line) > 5 and not line.startswith('// eslint-disable') and not line.startswith('// TODO'):
        print(f"Line {i+1}: {line}")
    elif line.startswith('const ') and ('=' in line) and ('(' in line):
        if len(line) < 100:
            print(f"Line {i+1}: Func: {line}")
