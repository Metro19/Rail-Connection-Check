import json

import requests

def fetch_json():
    # req = requests.get("https://api-v3.amtraker.com/v3/trains")
    #
    # save_json_to_file(req.json(), "TEST.pkl")
    #
    # return req.json()

    return read_json_from_file("TEST.pkl")

# the below code is just for testing
def save_json_to_file(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def read_json_from_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

print(fetch_json())