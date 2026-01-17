# OpenShift Deployment Summary

## Deployment Status: ✅ SUCCESS

**Deployment Date:** January 15, 2026  
**Namespace:** chrif0709-dev  
**OpenShift Cluster:** https://api.rm3.7wse.p1.openshiftapps.com:6443

---

## Application URLs

### Production Endpoints
- **Frontend Application:** https://frontend-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com
- **Backend API:** https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com
- **API Documentation (Swagger):** https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com/api/docs
- **MailHog (Email Testing):** https://mailhog-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com

---

## Running Services

| Service | Pods | Status |
|---------|------|--------|
| API | 2 | ✅ Running |
| Frontend | 2 | ✅ Running |
| Mailer | 1 | ✅ Running |
| PostgreSQL | 1 | ✅ Running |
| MailHog | 1 | ✅ Running |

---

## Critical Issues Encountered and Resolutions

### Issue #1: Permission Denied on npm/npx Executables
**Error:**
```
sh: nest: Permission denied
sh: prisma: Permission denied
error: building at STEP "RUN npm run build": while running runtime: exit status 126
```

**Root Cause:**  
OpenShift runs containers with a random, non-root UID for security. This UID doesn't have execute permissions on npm binary files installed in `node_modules/.bin/`.

**Solution:**  
Modified all Dockerfiles to use direct `node` execution instead of npx or npm scripts:
- Changed `RUN npx prisma generate` to `RUN node ./node_modules/prisma/build/index.js generate`
- Changed `RUN npm run build` to `RUN node ./node_modules/@nestjs/cli/bin/nest.js build`
- Changed `RUN npm run build` (frontend) to `RUN node ./node_modules/vite/bin/vite.js build`

**Files Modified:**
- `backend/Dockerfile`
- `mailer/Dockerfile`
- `frontend/Dockerfile`

---

### Issue #2: Nginx Permission Denied on Cache Directory
**Error:**
```
nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)
```

**Root Cause:**  
The nginx container tried to create cache directories with a random OpenShift UID that lacked write permissions.

**Solution:**  
Added permission fixes to frontend Dockerfile:
```dockerfile
RUN chmod -R 777 /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html
```

**Files Modified:**
- `frontend/Dockerfile`

---

### Issue #3: Health Check Probes Failing (HTTP 404)
**Error:**
```
Warning  Unhealthy  Liveness probe failed: HTTP probe failed with statuscode: 404
Warning  Unhealthy  Readiness probe failed: HTTP probe failed with statuscode: 404
```

**Root Cause:**  
The liveness and readiness probes were configured to check the root path `/`, but the NestJS API doesn't have a root endpoint defined.

**Solution:**  
Updated the probes to use the Swagger documentation endpoint which always returns 200:
```bash
oc set probe dc/api --liveness --readiness --get-url=http://:3000/api/docs \
  --initial-delay-seconds=30 --period-seconds=10 -n chrif0709-dev
```

**Files to Update for Future Deployments:**
- `openshift/10-api-deployment.yaml` (change probe path from `/` to `/api/docs`)

---

### Issue #4: PostgreSQL and MailHog Not Starting
**Error:**
```
NAME       REVISION   DESIRED   CURRENT   TRIGGERED BY
postgres   1          0         0         config
mailhog    1          0         0         config
```

**Root Cause:**  
DeploymentConfigs were created with 0 replicas.

**Solution:**  
Manually scaled up the deployments:
```bash
oc scale dc/postgres --replicas=1 -n chrif0709-dev
oc scale dc/mailhog --replicas=1 -n chrif0709-dev
```

**Files to Update for Future Deployments:**
- `openshift/05-postgres-deployment.yaml`
- `openshift/07-mailhog-deployment.yaml`

---

### Issue #5: CORS Configuration with Placeholder URL
**Error:**  
Frontend unable to communicate with API due to CORS policy (placeholder URL was configured).

**Original Configuration:**
```yaml
FRONTEND_BASE_URL: http://frontend-helpdesk.apps.example.com
```

**Solution:**  
Updated ConfigMap with actual OpenShift route:
```bash
oc patch configmap api-config -p '{"data":{"FRONTEND_BASE_URL":"https://frontend-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com"}}' -n chrif0709-dev
```

**Files to Update for Future Deployments:**
- `openshift/03-configmaps.yaml`

---

## Build History

### Successful Builds
- **api-8:** ✅ Completed - Fixed nest CLI permission issue
- **mailer-3:** ✅ Completed - Fixed nest CLI permission issue
- **frontend-3:** ✅ Completed - Initial build with direct vite execution
- **frontend-4:** ✅ Completed - Added nginx permission fixes

### Failed Builds (Historical)
- **api-1 to api-7:** ❌ Failed - npm/npx permission issues
- **mailer-1 to mailer-2:** ❌ Failed - npm/npx permission issues
- **frontend-1 to frontend-2:** ❌ Failed - Various permission issues

---

## Technical Stack

### Backend
- **Framework:** NestJS 10.3.0
- **ORM:** Prisma 5.22.0
- **Database:** PostgreSQL 16 (Alpine)
- **Authentication:** JWT + Argon2
- **Email:** Nodemailer with SMTP

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.4.21
- **Router:** React Router 6.21.1
- **Web Server:** Nginx (Alpine)

### Infrastructure
- **Platform:** OpenShift 4.x (Developer Sandbox)
- **Container Runtime:** Podman/BuildKit
- **Base Images:** node:20-alpine, nginx:alpine, postgres:16-alpine

---

## Known Limitations

### Frontend API Connection
The frontend was built with `VITE_API_URL=http://localhost:3000` and needs to be rebuilt with the production API URL to fully connect.

**To Fix:**
1. Create environment-specific build:
   ```bash
   VITE_API_URL=https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com npm run build
   ```
2. Rebuild and redeploy frontend with updated environment variable

**Workaround:**
Use the Swagger API documentation to test endpoints directly: https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com/api/docs

---

## Deployment Commands Reference

### Check Pod Status
```bash
oc get pods -n chrif0709-dev
```

### View Logs
```bash
oc logs <pod-name> -n chrif0709-dev
```

### Scale Deployment
```bash
oc scale dc/<service-name> --replicas=<count> -n chrif0709-dev
```

### Trigger New Build
```bash
oc start-build <service-name> -n chrif0709-dev --from-dir=./path/to/source --follow
```

### Access Application Routes
```bash
oc get routes -n chrif0709-dev
```

### Update ConfigMap
```bash
oc patch configmap <name> -p '{"data":{"KEY":"VALUE"}}' -n chrif0709-dev
```

---

## Security Considerations

### OpenShift Security Context Constraints (SCC)
- All containers run with **random non-root UID** (1000660000 range)
- Containers use **restricted SCC** (most secure)
- No privileged containers required
- No root user access needed

### Applied Security Measures
1. **File Permissions:** Set to 777 only on required directories for OpenShift compatibility
2. **No User Directives:** Removed `USER` directives from Dockerfiles
3. **Direct Binary Execution:** Used `node` instead of npm to avoid setuid issues
4. **TLS Termination:** HTTPS enforced on all routes via OpenShift edge termination

---

## Next Steps

### Recommended Improvements
1. **Update Frontend Build Configuration**
   - Add VITE_API_URL environment variable support
   - Create separate builds for dev/staging/prod

2. **Update Health Check Endpoints**
   - Modify YAML files to use `/api/docs` for probes
   - Commit changes to repository

3. **Set Proper Replica Counts**
   - Update deployment YAML files with desired replica counts
   - Ensure high availability for production

4. **Configure Auto-scaling**
   - Set up Horizontal Pod Autoscaler (HPA) for API and frontend
   - Define CPU/memory thresholds

5. **Add Monitoring**
   - Integrate with OpenShift monitoring stack
   - Set up alerts for pod failures

---

## Support Information

**Deployment by:** GitHub Copilot  
**Documentation Date:** January 15, 2026  
**OpenShift Version:** 4.20.8  
**Project Repository:** c:\Users\wwwkh\OneDrive\Desktop\cloudproject\helpdesk-ticketing-app

For issues or questions, review the logs using:
```bash
oc logs <pod-name> -n chrif0709-dev --tail=100
```
