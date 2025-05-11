# Handshake Server

## Professional Profiles Data Flow

### Overview

Professional profiles in Handshake use the `ProfessionalProfile` collection as the single source of truth. 

The data flow is as follows:

1. When a user registers as a professional or changes their role to professional, a basic professional profile is automatically created in the `ProfessionalProfile` collection.
2. The `/professionals` discovery page retrieves profiles directly from the `ProfessionalProfile` collection.
3. The `/public-profile-setup` page allows professionals to update their profile, which saves to the `ProfessionalProfile` collection.
4. When a professional saves their public profile, a custom event is dispatched that triggers a refresh of the professionals list on the discovery page.

### API Endpoints

#### Professional Profiles

- `GET /api/professionalprofiles/me` - Get the current user's professional profile (requires authentication)
- `POST /api/professionalprofiles` - Create or update the current user's professional profile (requires authentication)
- `GET /api/professionalprofiles/:id` - Get a specific professional's public profile by user ID (public route)

#### Professionals Discovery

- `GET /api/professionals` - Get a list of all professionals with their profiles (public route)
- `GET /api/professionals/:id` - Get a specific professional by ID with their profile (requires authentication)

### Migration Script

To create professional profiles for existing users, run:

```
node scripts/createMissingProfessionalProfiles.js
```

This script will:
1. Find all users with role = 'professional'
2. Check if they have a corresponding entry in the ProfessionalProfile collection
3. Create a new profile for any professional without one 