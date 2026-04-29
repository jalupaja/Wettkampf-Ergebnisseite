#!/usr/bin/env python3
import csv
import sys
from datetime import datetime
from pathlib import Path

def calculate_age(birth_date_str):
    """Calculate age from birth date string."""
    try:
        for fmt in ['%d.%m.%Y', '%Y-%m-%d', '%d/%m/%Y']:
            try:
                birth_date = datetime.strptime(birth_date_str.strip(), fmt)
                age = datetime.now().year - birth_date.year
                if (datetime.now().month, datetime.now().day) < (birth_date.month, birth_date.day):
                    age -= 1
                return age
            except ValueError:
                continue
    except Exception:
        pass
    return None

def get_group(anrede, age):
    gender = anrede.strip().lower() if anrede else ''
    suffix = 'm' if gender == 'herr' elif 'w' if gender = 'frau' else ''
    if !suffix:
        print(f"ERROR: wrong Anrede {anrede}")
    
    if age is None:
        return None
    elif age <= 10:
        return f"bis 10 {suffix}"
    elif age <= 15:
        return f"11-15 {suffix}"
    elif age <= 29:
        return f"16-29 {suffix}"
    elif age <= 49:
        return f"30-49 {suffix}"
    else:
        return f"ab 50 {suffix}"

def convert_csv(input_file, output_file):
    results = []
    seen_names = set()
    
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        sample = f.read(1024)
        delimiter = ';' if ';' in sample else ','
    
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f, delimiter=delimiter)
        
        for row in reader:
            anrede = row.get('Anrede', '')
            vorname = row.get('Vorname', '')
            nachname = row.get('Nachname', '')
            geburtsdatum = row.get('Geburtsdatum', '')
            email = row.get('Email', '')
            
            username = email.strip() if email else f"{vorname.lower()}.{nachname.lower()}"
            username = username.replace(' ', '.')
            
            if username in seen_names:
                print(f"Skipping duplicate: {username}")
                continue
            seen_names.add(username)
            
            age = calculate_age(geburtsdatum)
            group = get_group(anrede, age)
            
            if not group:
                print(f"Warning: Could not determine group for {username}")
            
            results.append({
                'username': username,
                'password': '',
                'role': 'athlete',
                'groupName': group or ''
            })
    
    # Write output CSV
    headers = ['username', 'password', 'role', 'groupName']
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(results)
    
    print(f"Converted {len(results)} users to {output_file}")
    print("Groups used:")
    groups = {}
    for r in results:
        g = r['groupName'] or 'Unknown'
        groups[g] = groups.get(g, 0) + 1
    for g, c in sorted(groups.items()):
        print(f"  {g}: {c}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python convert_users.py <input.csv> [output.csv]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'users.csv'
    
    # Move to temp/settings directory
    output_path = Path(__file__).parent.parent / 'settings' / output_file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    convert_csv(input_file, str(output_path))
