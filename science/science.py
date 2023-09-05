import requests
import json
from pprint import pprint
from urllib.parse import unquote, urlparse

import sys


threadurl = sys.argv[1]
netloc = urlparse(threadurl).netloc
path = urlparse(threadurl).path
apiurl = f"https://{netloc}/api/v1/statuses/{path[path.rfind('/'):]}"

response = requests.get(apiurl)
root = json.loads(response.text) # this converts the json to a python list of dictionary
# pprint(root["content"])
json.dump(root, open("root.json","w"), indent=2)

response = requests.get(f"{apiurl}/context")
statuses = json.loads(response.text) # this converts the json to a python list of dictionary
desc = []

for reply in statuses["descendants"]:
    if (
        reply["account"]["id"] == root["account"]["id"]
        and root["account"]["id"] == reply["in_reply_to_account_id"]
    ):
        desc.append({
            "id": reply["id"],
            "url": reply["url"],
            "content": reply["content"],
            "author": reply["account"]["id"],
            "in_reply_to_id":reply["in_reply_to_id"],
            "in_reply_to_account_id":reply["in_reply_to_account_id"],
            "author-username": reply["account"]["username"]
        })
    
json.dump(desc, open("desc.json", "w"), indent=2)

toot_dict = {
    toot["id"]:toot for toot in desc
}

toot_dict[root["id"]] = root

longest_chain = -1
longest_chain_index = -1
chains = []
for i,toot in enumerate(desc):
    new_chain = []
    cursor = toot_dict[toot["id"]]

    while True:
        new_chain.append(cursor["id"])
        
        if cursor["in_reply_to_id"] == None:
            break
        cursor = toot_dict[cursor["in_reply_to_id"]]
    
    chains.append(new_chain)
    if len(new_chain) > longest_chain:
        longest_chain = len(new_chain)
        longest_chain_index = i

# pprint(chains[longest_chain_index])
html = ""
for id in reversed(chains[longest_chain_index]):
    # print(toot_dict[id]["content"])
    html += toot_dict[id]["content"]
print(f"Saved thread with {longest_chain} posts!")
print(html, file=open("index.html","w"))
