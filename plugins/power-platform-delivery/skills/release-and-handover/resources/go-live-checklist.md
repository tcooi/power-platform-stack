# Go-live checklist

- [ ] Managed solution version bumped, checker passed, UAT signed off
- [ ] Environment variables and connection references set for PROD (deployment settings)
- [ ] Security roles, teams, app sharing assigned; licenses assigned
- [ ] Flows turned on under the service account; agents published; scheduled jobs active
- [ ] Deployed via pipelines/CI with a deployment settings file, not manual import
- [ ] Data migration done and reconciled; manual backup taken (`pac admin backup --environment <id> --label "pre-go-live"`)
- [ ] Monitoring: flow failure alerts, Application Insights / Managed Environments insights
- [ ] Rollback plan tested; support contacts and hypercare agreed
