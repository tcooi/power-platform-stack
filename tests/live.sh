#!/bin/sh
# Live smoke tests against a TEST environment. Needs: az login, a .pp/project.json in the current
# folder listing that environment, the E2E fixtures (table claude_e2etestitem, role "E2E Tester",
# flow id in $PP_FLOW, test user in $PP_TEST_USER). Usage: sh tests/live.sh  (from the project folder)
set -e
P="$(dirname "$0")/../plugins/power-platform-delivery/scripts/ppdv.mjs"
j() { python3 -c "import sys,json;d=json.load(sys.stdin);$1"; }
node "$P" whoami | j "assert d['ok'];print('whoami ok',d['org'])"
node "$P" role get --role "E2E Tester" | j "assert any('claude_e2etestitem' in p['name'] for p in d['privileges']);print('role get ok')"
[ -n "$PP_FLOW" ] && node "$P" flow check-trigger --flow "$PP_FLOW" | j "assert d['registered'] and not d['issues'];print('flow trigger ok')"
[ -n "$PP_TEST_USER" ] && node "$P" test as-user --user "$PP_TEST_USER" --table claude_e2etestitem --ops create,read,update,delete,read-others --apply | j "r=d['results'];assert r['create']=='allowed' and r['delete']=='denied' and r['readOthers']=='denied';print('as-user ok',r)"
ROW=$(node "$P" request POST claude_e2etestitems --data '{"claude_name":"[live test] row"}' --apply | j "import re;print(re.search(r'\(([^)]+)\)$',d['entityId']).group(1))")
node "$P" artifacts add --type row --id "$ROW" --table claude_e2etestitem --name "live test row" >/dev/null
node "$P" teardown --apply | j "assert d['ok'];print('teardown ok')"
echo "live tests passed"
