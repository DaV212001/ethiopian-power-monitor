"""
Seeds all 116 Addis Ababa Woredas into Supabase PostGIS via the RPC endpoint.
"""

import urllib.request
import json
import os
import sys
import time

SUPABASE_URL = "https://szyktmgtclujvuooofnc.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eWt0bWd0Y2x1anZ1b29vZm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTA5NzgsImV4cCI6MjEwNDI4Njk3OH0.hlGMgt-i1yAjQwtIbf9_1RHs9oh3NpDaADnhREg7G9Y"
SQL_FILE = os.path.join(os.path.dirname(__file__), "seed_woredas.sql")

def seed_database():
    with open(SQL_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    lines = [l.strip() for l in text.splitlines() if l.strip().startswith("INSERT INTO woredas")]
    total = len(lines)
    print(f"Loaded {total} woreda insert statements from {SQL_FILE}")

    endpoint = f"{SUPABASE_URL}/rest/v1/rpc/exec_seed"
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json"
    }

    chunk_size = 5
    successful = 0

    for i in range(0, total, chunk_size):
        chunk = lines[i:i+chunk_size]
        query = ";\n".join(chunk) + ";"
        
        payload = json.dumps({"query_text": query}).encode("utf-8")
        req = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 204):
                    successful += len(chunk)
                    print(f"Progress: {successful}/{total} woredas inserted into PostGIS...")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"Error at chunk {i//chunk_size + 1}: {e.code} - {err_body}")
            sys.exit(1)
        time.sleep(0.05)

    print(f"Successfully seeded all {successful} woredas into PostGIS!")

if __name__ == "__main__":
    seed_database()
