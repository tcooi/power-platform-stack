#!/bin/sh
# Live smoke tests against your own SANDBOX. Run from a project folder whose .pp/project.json lists that environment.
# Needs: az login, and test fixtures you created there (see tests/README.md):
#   PP_TABLE      logical name of a test table with a <prefix>_name column   (required)
#   PP_ROLE       a security role with privileges on that table              (required)
#   PP_SOLUTION   the unmanaged solution holding them                        (required)
#   PP_FLOW       workflow id of a Dataverse-triggered flow on the table     (optional)
#   PP_TEST_USER  UPN of a user with only that role                          (optional)
set -e
: "${PP_TABLE:?set PP_TABLE (see tests/README.md)}" "${PP_ROLE:?set PP_ROLE}" "${PP_SOLUTION:?set PP_SOLUTION}"
P="$(dirname "$0")/../plugins/power-platform-delivery/scripts/ppdv.mjs"
PREFIX="${PP_TABLE%%_*}"
j() { python3 -c "import sys,json;d=json.load(sys.stdin);$1"; }
node "$P" whoami | j "assert d['ok'];print('whoami ok',d['org'])"
node "$P" role get --role "$PP_ROLE" | j "assert any('$PP_TABLE' in p['name'] for p in d['privileges']);print('role get ok')"
[ -n "$PP_FLOW" ] && node "$P" flow check-trigger --flow "$PP_FLOW" | j "assert d['registered'] and not d['issues'];print('flow trigger ok')"
[ -n "$PP_TEST_USER" ] && node "$P" test as-user --user "$PP_TEST_USER" --table "$PP_TABLE" --ops create,read,update,delete,read-others --apply | j "r=d['results'];assert r['create']=='allowed' and r['delete']=='denied' and r['readOthers']=='denied';print('as-user ok',r)"
SET=$(node "$P" request GET "EntityDefinitions(LogicalName='$PP_TABLE')?\$select=EntitySetName" | j "print(d['body']['EntitySetName'])")
ROW=$(node "$P" request POST "$SET" --data "{\"${PREFIX}_name\":\"[live test] row\"}" --reason "live smoke test row" --apply | j "import re;print(re.search(r'\(([^)]+)\)$',d['entityId']).group(1))")
node "$P" artifacts add --type row --id "$ROW" --table "$PP_TABLE" --name "live test row" >/dev/null
node "$P" teardown --apply | j "assert d['ok'];print('teardown ok')"
node "$P" verify --solution "$PP_SOLUTION" --since "$(date -u -v-2d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '2 days ago' +%Y-%m-%dT%H:%M:%SZ)" | j "assert d['ok'], d['findings'];print('verify ok',d['checked'],'components')"
echo "live tests passed"
