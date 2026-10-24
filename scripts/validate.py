import json,os,re,sys
m=json.load(open(".claude-plugin/marketplace.json")); bad=0
for p in m["plugins"]:
    d=p["source"]; pj=f"{d}/.claude-plugin/plugin.json"
    if not os.path.exists(pj): print("missing",pj); bad+=1; continue
    j=json.load(open(pj))
    if j["name"]!=p["name"] or j.get("version")!=p.get("version"): print("name/version mismatch",p["name"]); bad+=1
    for f in os.listdir(f"{d}/agents"):
        t=open(f"{d}/agents/{f}").read()
        if not (f.endswith(".agent.md") and re.match(r"---\nname: .+\ndescription: \".+\"\n---",t)): print("bad agent",f); bad+=1
    sd=f"{d}/skills"
    if os.path.isdir(sd):
        for k in os.listdir(sd):
            t=open(f"{sd}/{k}/SKILL.md").read()
            if not re.match(r"---\nname: "+re.escape(k)+r"\ndescription: \".+\"\n---",t): print("bad skill",k); bad+=1
    rules_f=f"{d}/skills/delivery-method/resources/subagent-rules.md"
    if os.path.exists(rules_f):
        canon=open(rules_f).read().split("\n\n",2)[-1].strip()
        for f in os.listdir(f"{d}/agents"):
            if f.startswith("pp-delivery-lead") or f.startswith("uat-tester"): continue  # lead is the main agent; uat-tester has a test-specific hand-back
            if canon not in open(f"{d}/agents/{f}").read(): print("sub-agent rules drifted:",f); bad+=1
    fb_f=f"{d}/fallbacks.json"
    if os.path.exists(fb_f):
        import datetime
        fb=json.load(open(fb_f)); ids=set()
        for e in fb["entries"]:
            miss=[k for k in ("id","skill","plugin","kind","checkedAgainst","checked","status","need","use") if not e.get(k)]
            if miss: print("fallback entry missing",miss,e.get("id")); bad+=1; continue
            if e["id"] in ids: print("duplicate fallback id",e["id"]); bad+=1
            ids.add(e["id"])
            if e["plugin"] not in fb["sources"]: print("fallback",e["id"],"unknown plugin",e["plugin"]); bad+=1
            if e["status"] not in ("active","retired"): print("fallback",e["id"],"bad status"); bad+=1
            sk=f"{d}/skills/{e['skill']}/SKILL.md"
            body=open(sk).read() if os.path.exists(sk) else ""
            if e["status"]=="active" and f"`{e['id']}`" not in body: print("fallback",e["id"],"not referenced in",sk); bad+=1
            if e["status"]=="retired" and f"`{e['id']}`" in body: print("fallback",e["id"],"is retired but still in",sk); bad+=1
            if e["status"]=="active" and (datetime.date.today()-datetime.date.fromisoformat(e["checked"])).days>90:
                print("warning: fallback",e["id"],"last checked",e["checked"],"- run: ppdv fallbacks outdated")
print("OK" if not bad else "FAILED"); sys.exit(bad)
