"""
Standalone .env diagnostic — run this directly to see exactly what's
happening, without needing to start the full Flask server.

Usage (from inside the backend/ folder):
    python check_env.py
"""
import os
import sys

print(f"Current working directory: {os.getcwd()}")
print(f"Looking for .env in this folder: {os.path.isfile('.env')}")

if os.path.isfile('.env'):
    print("\n--- Raw .env file contents (key values masked) ---")
    with open('.env', 'r', encoding='utf-8-sig') as f:  # utf-8-sig strips a BOM if present
        for i, line in enumerate(f.readlines(), 1):
            stripped = line.rstrip('\n')
            if '=' in stripped and not stripped.strip().startswith('#'):
                key, _, val = stripped.partition('=')
                masked = val[:4] + '...' + val[-2:] if len(val) > 8 else '(too short?)'
                print(f"  Line {i}: {key!r} = {masked!r}   (raw length: {len(val)})")
            else:
                print(f"  Line {i}: {stripped!r}")
else:
    print("!! No .env file found in this directory. Run this script from inside backend/.")

print("\n--- Now trying python-dotenv ---")
try:
    from dotenv import load_dotenv
    loaded = load_dotenv()
    print(f"load_dotenv() returned: {loaded}  (True = found and loaded a .env file)")
except ImportError:
    print("!! python-dotenv is not importable in this Python environment.")
    sys.exit(1)

print("\n--- Final result ---")
key = os.environ.get("GROQ_API_KEY", "")
if key:
    print(f"GROQ_API_KEY IS set. Length: {len(key)}. Starts with: {key[:6]!r}. Ends with: {key[-4:]!r}")
    if not key.startswith("gsk_"):
        print("!! WARNING: Groq keys normally start with 'gsk_' — this one doesn't. Check for a copy-paste mistake.")
    if key != key.strip():
        print("!! WARNING: key has leading/trailing whitespace — that will break auth.")
else:
    print("GROQ_API_KEY is EMPTY / not set. This confirms the .env isn't being picked up.")
    print("Double check: variable name is exactly GROQ_API_KEY (all caps, no typos),")
    print("and there's no space around the '=' sign, e.g.:  GROQ_API_KEY=gsk_abc123")