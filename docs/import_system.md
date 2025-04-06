# Markdown Import System Documentation

## Overview

The Markdown Import System is a robust solution for automatically importing and synchronizing markdown content from an Obsidian vault into our Next.js application's database. It supports both full imports and differential imports based on git changes.

## Features

- **Differential Imports**: Only process changed files using git diff
- **Full Imports**: Import entire vault when needed
- **GitHub Integration**: Automatic imports via webhooks
- **Import Tracking**: Track import history and file changes
- **Error Handling**: Comprehensive error tracking and reporting
- **Transaction Support**: Atomic operations for data consistency

## Setup

### Environment Variables

```env
VAULT_PATH=/path/to/vault
WIKI_DIRECTORY=wiki
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### Database Migration

Run the following commands to set up the database:

```bash
# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### GitHub Webhook Configuration

1. Go to your repository settings
2. Navigate to Webhooks
3. Add new webhook:
   - Payload URL: `https://your-domain.com/api/webhook/github`
   - Content type: `application/json`
   - Secret: Same as `GITHUB_WEBHOOK_SECRET`
   - Events: Select "Push"

## Usage

### Manual Import

#### Full Import

```bash
# Import entire vault
ts-node scripts/import-vault-content.script.ts
```

#### Differential Import

```bash
# Import only changed files
ts-node scripts/import-diff.script.ts
```

### API Endpoints

#### Check Import Status

```http
GET /api/import/status

Response:
{
  "status": "success",
  "data": {
    "commitHash": "...",
    "importedAt": "...",
    "status": "success|error"
  }
}
```

#### Trigger Import

```http
POST /api/import
Content-Type: application/json

{
  "type": "full|diff"
}

Response:
{
  "status": "success",
  "data": {
    "type": "full|diff",
    "commitHash": "...",
    "timestamp": "..."
  }
}
```

#### Test Webhook

```http
GET /api/webhook/github

Response:
{
  "status": "success",
  "data": {
    "message": "GitHub webhook endpoint is configured correctly",
    "timestamp": "..."
  }
}
```

## Error Handling

The system includes comprehensive error handling:

1. **Import Errors**

   - Failed imports are logged in `git_import_logs`
   - Individual file errors are tracked in `import_metadata`

2. **Webhook Errors**

   - Invalid signatures are rejected
   - Non-main branch pushes are ignored
   - All errors are logged with details

3. **Recovery**
   - Failed imports can be retried
   - System maintains consistency during errors

## Monitoring

### Import Logs

Check the import logs in the database:

```sql
-- Latest imports
SELECT * FROM git_import_logs ORDER BY imported_at DESC LIMIT 10;

-- Failed imports
SELECT * FROM git_import_logs WHERE status = 'error';

-- Import statistics
SELECT
  DATE(imported_at) as date,
  COUNT(*) as total_imports,
  SUM(files_changed) as total_files_changed
FROM git_import_logs
GROUP BY DATE(imported_at)
ORDER BY date DESC;
```

### File Status

Track individual file status:

```sql
-- Files with errors
SELECT * FROM import_metadata WHERE error IS NOT NULL;

-- Recently modified files
SELECT * FROM import_metadata ORDER BY last_import DESC LIMIT 10;
```

## Best Practices

1. **Regular Backups**

   - Back up the database before large imports
   - Keep backup of the vault

2. **Monitoring**

   - Check import logs regularly
   - Monitor webhook responses
   - Set up alerts for repeated failures

3. **Maintenance**
   - Clean up old import logs periodically
   - Verify webhook configuration regularly
   - Update dependencies when needed

## Troubleshooting

### Common Issues

1. **Webhook Not Working**

   - Verify webhook secret
   - Check server logs
   - Confirm webhook URL is accessible

2. **Import Failures**

   - Check file permissions
   - Verify database connection
   - Review error logs

3. **Performance Issues**
   - Check batch sizes
   - Monitor database indexes
   - Review transaction usage

### Debug Commands

```bash
# Check webhook configuration
curl -X GET https://your-domain.com/api/webhook/github

# Manually trigger import
curl -X POST https://your-domain.com/api/import \
  -H "Content-Type: application/json" \
  -d '{"type":"diff"}'

# Check import status
curl -X GET https://your-domain.com/api/import/status
```

## Support

For issues and support:

1. Check the error logs
2. Review the documentation
3. Open an issue in the repository
4. Contact the development team
