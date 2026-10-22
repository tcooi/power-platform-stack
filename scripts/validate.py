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
print("OK" if not bad else "FAILED"); sys.exit(bad)
