# Wiki Galipette Cendrée API Documentation

This document provides comprehensive documentation for the Wiki Galipette Cendrée API endpoints.

## Base URL

All API endpoints are relative to the base URL of your application.

## Authentication

Currently, the API does not require authentication. This may change in future versions.

## Error Handling

All API endpoints follow a consistent error handling pattern:

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Error responses include a JSON object with an `error` property containing a description of the error.

Example error response:

```json
{
  "error": "Article not found"
}
```

## API Endpoints

### Articles

#### Get All Article Paths

```
GET /api/articles/paths
```

Returns a list of all article paths in the database.

**Response**:

```json
[{ "path": "folder1/article1" }, { "path": "folder2/article2" }]
```

#### Get Article by Path

```
GET /api/articles/path/{path}
```

Returns the article with the specified path.

**Parameters**:

- `path`: The path of the article (URL encoded)

**Response**:

```json
{
  "title": "Article Title",
  "content": "Article content in markdown",
  "path": "folder/article",
  "metadata": { ... },
  "related_articles": [ ... ],
  "mention_articles": [ ... ]
}
```

#### Search Articles

```
GET /api/articles/search?q={query}
```

Searches for articles containing the given query in title, content, or tags.

**Parameters**:

- `q`: The search query string

**Response**:

```json
{
  "articles": [
    {
      "title": "Matching Article",
      "content": "Content with matching terms",
      "path": "folder/article",
      "metadata": { ... }
    }
  ]
}
```

#### Get Related Articles by Tags

```
GET /api/articles/related/{path}
```

Returns articles that share tags with the specified article.

**Parameters**:

- `path`: The path of the article (URL encoded)

**Response**:

```json
[
  {
    "title": "Related Article",
    "content": "Content of related article",
    "path": "folder/related-article",
    "metadata": { ... }
  }
]
```

#### Get Folder Tree

```
GET /api/folders/tree
```

Returns the folder structure with articles.

**Response**:

```json
[
  {
    "id": 1,
    "name": "folder1",
    "parentId": null,
    "articles": [
      {
        "title": "Article 1",
        "path": "folder1/article1"
      }
    ]
  }
]
```

### Database Management

#### Import Vault Content

```
POST /api/db/import
```

Imports markdown files from the vault directory into the database.

**Response**:

```json
{
  "success": true,
  "message": "Import completed successfully",
  "stats": {
    "articlesImported": 10,
    "relationsCreated": 15
  }
}
```

#### Flush Database

```
POST /api/db/flush
```

Flushes all data from the database. **Use with caution!**

**Response**:

```json
{
  "success": true,
  "message": "Database flushed successfully"
}
```

## Usage Examples

### JavaScript Fetch API

```javascript
// Get article by path
fetch("/api/articles/path/folder/article")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));

// Search articles
fetch("/api/articles/search?q=keyword")
  .then(response => response.json())
  .then(data => console.log(data.articles))
  .catch(error => console.error("Error:", error));

// Import vault content
fetch("/api/db/import", { method: "POST" })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));
```

### cURL

```bash
# Get article by path
curl -X GET "http://localhost:3000/api/articles/path/folder/article"

# Search articles
curl -X GET "http://localhost:3000/api/articles/search?q=keyword"

# Import vault content
curl -X POST "http://localhost:3000/api/db/import"
```

## Rate Limiting

Currently, there are no rate limits on API requests. This may change in future versions.

## Changelog

- **v0.0.1** (Initial release): Basic article and database management endpoints
