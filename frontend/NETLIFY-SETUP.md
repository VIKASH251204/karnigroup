# Live API and login

The Angular app calls `/api` on the same domain. Netlify Functions serves these routes and Netlify Database stores application records. Site visit photos are stored in Netlify Blobs. No separate .NET process or backend hosting is needed for this deployment.

After deployment, open `https://karniadmin.netlify.app/api/health`. A working database connection returns JSON with `status: "ok"` and `database: "connected"`. Protected API routes return 401 until you sign in.

## Set up the first administrator

1. Open the [project dashboard](https://app.netlify.com/projects/karniadmin) and select **Identity**.
2. Invite your administrator email address.
3. Open the invitation email and set your password on the site.
4. In the dashboard's Identity user details, add the **admin** role and save.
5. Sign out and sign in again. The panel creates the linked administrator record on first authorized access.

If the invitation is accepted before the admin role is assigned, the panel may show that the account is not linked. Assign the role and sign in again. Password reset links are handled by the login page.

Administrators can add staff from the panel's Users page. These accounts are created in Identity and linked to their application records. Blocked application accounts cannot access API data. Associates can register clients and create site visits and photos; business administration and edits require an administrator.

The new Netlify database starts empty. Previous local .NET/SQLite data and demo accounts are not copied automatically. Add real records through the panel; saved records persist across requests and deployments. Existing applied migrations have been preserved, and the new Identity linkage migration is applied automatically on deployment.

## Local development

From the repository root, run `npx netlify dev --port 8889` and open `http://localhost:8889`. Use this address for both the app and API so Netlify Functions and Identity are available. The standalone Angular command and its existing port 5080 proxy remain available for development against the original .NET backend.
