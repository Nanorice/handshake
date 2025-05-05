### Project Rules
1. **Frontend**:
   - Use functional React components with Tailwind classes.
   - Use PascalCase for component filenames (e.g., `BookingCard.tsx`).

2. **Backend**:
   - Organize routes into `server/src/routes/` with clear responsibility separation.
   - Use TypeScript for new code (`.ts` extension).
   - Use `async/await` for MongoDB operations (no callbacks).

3. **Security**:
   - Never expose JWT secrets or Stripe keys – use `.env`.
   - Validate API inputs with Zod (e.g., email/password checks).

4. **Naming**:
   - Database collections: `camelCase` (e.g., `users`, `professionals`).
   - React hooks: `useBookingForm`, `useAuth`.
   - Components: PascalCase (e.g., `ProfileCard`, `BookingForm`).

5. **Documentation**:
   - Update `notepad.md` with reusable code snippets.
   - Keep DATABASE_SCHEMA.md in sync with model changes.

6. **Interaction**:
   - When I asking about the code:
      - Explain code like you’re a beginner
      - Walk through step-by-step logic
      - Suggest better patterns

7. **Execution**:
   - When I say you have full automony you can have the max access
   - by default do not execute any terminal commands and do not allow auto-run