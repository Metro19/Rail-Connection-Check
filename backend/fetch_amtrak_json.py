import json

import requests

def fetch_json():
    req = requests.get("https://api-v3.amtraker.com/v3/trains")
    return req.json()