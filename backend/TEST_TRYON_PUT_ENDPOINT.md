# Try-On PUT Endpoint - Testing & Verification Guide

## Overview

This document provides comprehensive testing and verification instructions for the PUT endpoint that updates try-on sessions while preserving critical data (customer images, session info, and result photos).

## Implementation Summary

### Endpoint Details

- **Method**: PUT
- **Path**: `/api/try-on-sessions/:id`
- **Alternative Path**: `/api/try-on/sessions/:id` (both work due to dual registration)
- **Authentication**: Required (JWT Bearer token)
- **Database**: Updates stored in `try_on_sessions` table

### Key Features

✅ Preserves customer image URL  
✅ Preserves product ID  
✅ Preserves user ID  
✅ Safely updates optional fields  
✅ Returns complete updated session  
✅ Validates user ownership before update

## Database Schema

The `try_on_sessions` table includes:

```typescript
{
  id: string (UUID)
  userId: string (FK - users.id)
  customerImageUrl: string (REQUIRED - preserved)
  productId: string (FK - products.id)
  tryOnImageUrl: string (nullable - can be updated)
  fitRecommendation: string (JSON - can be updated)
  status: string (default: 'processing' - can be updated)
  isFavorite: boolean (default: false - can be updated)
  notes: string (nullable - can be updated)
  rating: integer (nullable, 1-5 - can be updated)
  createdAt: timestamp (auto)
}
```

## Updatable Fields

The following fields can be updated via PUT:

- `tryOnImageUrl` - Result image from virtual try-on
- `status` - processing | completed | failed
- `fitRecommendation` - JSON string with fit details
- `isFavorite` - boolean
- `notes` - user text notes
- `rating` - 1-5 rating

## Preserved Fields (NOT updated by PUT)

These critical fields are automatically preserved:

- `id` - Session ID
- `userId` - Owner of the session
- `customerImageUrl` - Customer's photo
- `productId` - Associated product
- `createdAt` - Creation timestamp

## Testing Instructions

### Method 1: Direct Database Test

```bash
cd backend
npx tsx test-tryon-put.ts
```

**Requirements:**

- MySQL server running on localhost:8889
- Valid database credentials in .env
- User table exists

**What it tests:**

- User creation
- Session creation
- Full update with all fields
- Partial update (single field)
- Data preservation
- Field integrity

### Method 2: HTTP/API Test

```bash
chmod +x test-tryon-put.sh
./test-tryon-put.sh
```

**Requirements:**

- Backend server running: `npm run dev`
- Valid JWT token

**What it tests:**

- Authentication requirement (should fail without token)
- Endpoint routing
- Response format
- HTTP status codes

### Method 3: Manual cURL Testing

#### Step 1: Start the backend

```bash
npm run dev
```

#### Step 2: Generate or obtain a JWT token

You can get a token by:

1. Registering a new user
2. Logging in to get a token
3. Or using a test token from your app

#### Step 3: Create a test session (optional)

```bash
curl -X POST http://localhost:3003/api/try-on-sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-123",
    "productName": "Test Product",
    "customerImageUrl": "https://example.com/customer.jpg"
  }'
```

#### Step 4: Update the session

```bash
curl -X PUT http://localhost:3003/api/try-on-sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tryOnImageUrl": "https://example.com/result.jpg",
    "status": "completed",
    "fitRecommendation": "{\"fit\": \"perfect\", \"confidence\": 0.95}",
    "isFavorite": true,
    "notes": "Great fit!",
    "rating": 5
  }'
```

#### Expected Response (200 OK):

```json
{
  "success": true,
  "session": {
    "id": "SESSION_ID",
    "userId": "USER_ID",
    "customerImageUrl": "https://example.com/customer.jpg",
    "productId": "product-123",
    "tryOnImageUrl": "https://example.com/result.jpg",
    "fitRecommendation": "{\"fit\": \"perfect\", \"confidence\": 0.95}",
    "status": "completed",
    "isFavorite": true,
    "notes": "Great fit!",
    "rating": 5,
    "createdAt": "2024-11-30T..."
  }
}
```

## Verification Checklist

### Data Integrity

- [ ] `customerImageUrl` remains unchanged
- [ ] `productId` remains unchanged
- [ ] `userId` remains unchanged
- [ ] `createdAt` remains unchanged
- [ ] New `tryOnImageUrl` is saved correctly
- [ ] `status` is updated to "completed"
- [ ] `isFavorite` is set to true
- [ ] `notes` are saved correctly
- [ ] `rating` is saved correctly

### Security

- [ ] Endpoint requires authentication (returns 401 without token)
- [ ] User can only update their own sessions
- [ ] Invalid session ID returns 404
- [ ] Invalid user token is rejected

### Response Format

- [ ] Response includes success flag
- [ ] Response includes complete session object
- [ ] All fields are present in response
- [ ] Response is valid JSON

## Partial Update Testing

Test updating only one field:

```bash
curl -X PUT http://localhost:3003/api/try-on-sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4
  }'
```

**Verify:**

- Only rating is changed
- All other fields remain the same
- No data loss occurs

## File Preservation Test

Test that file URLs are preserved:

```bash
# Create session
curl -X POST http://localhost:3003/api/try-on-sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-123",
    "productName": "Test Product",
    "customerImageUrl": "https://example.com/customer.jpg"
  }'

# Update with result image
curl -X PUT http://localhost:3003/api/try-on-sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tryOnImageUrl": "https://example.com/result.jpg",
    "status": "completed"
  }'

# Verify both images are present
curl -X GET http://localhost:3003/api/try-on-sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Result:**

```json
{
  "session": {
    "customerImageUrl": "https://example.com/customer.jpg",
    "tryOnImageUrl": "https://example.com/result.jpg"
  }
}
```

## Troubleshooting

### Issue: 401 Unauthorized

**Cause**: No token or invalid token provided
**Solution**: Include valid JWT token in Authorization header: `Authorization: Bearer <token>`

### Issue: 404 Not Found

**Cause**: Session doesn't exist or belongs to different user
**Solution**: Verify session ID and that you're using correct user's token

### Issue: 500 Server Error

**Cause**: Database connection or validation error
**Solution**: Check server logs and database connection in .env

### Issue: Data not saving

**Cause**: Database connection issue
**Solution**:

1. Verify MySQL is running
2. Check database credentials in .env
3. Ensure database and tables exist

## Performance Considerations

The implementation includes:

- Single user ownership check before update
- Conditional update (only updates changed fields)
- Efficient query using indexed userId
- Minimal database round-trips

## Code Reference

### PUT Handler Location

`backend/routes/try-on.ts` - Lines 230-320 (both `/sessions/:id` and `/:id` routes)

### Key Implementation Details

```typescript
// Preserves existing session before update
const [existingSession] = await db
  .select()
  .from(tryOnSessions)
  .where(and(
    eq(tryOnSessions.id, id),
    eq(tryOnSessions.userId, req.user!.id)
  ));

// Only updates fields explicitly provided
const updateData: any = {};
if (tryOnImageUrl !== undefined) updateData.tryOnImageUrl = tryOnImageUrl;
// ... other fields

// Only performs update if there are changes
if (Object.keys(updateData).length > 0) {
  await db.update(tryOnSessions).set(updateData).where(...);
}

// Returns complete updated session
const [updatedSession] = await db.select().from(tryOnSessions)...;
```

## Success Criteria

✅ All tests pass  
✅ Customer images preserved  
✅ Result photos saved  
✅ Session metadata intact  
✅ User ownership verified  
✅ Partial updates work  
✅ No unauthorized access  
✅ Proper error handling

## Next Steps

1. Run the test suite to verify functionality
2. Review database for saved data
3. Test with actual frontend requests
4. Monitor server logs for any errors
5. Deploy to production with confidence
