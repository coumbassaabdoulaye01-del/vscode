# VS Code Web Terminal & API Key System - TODO

## Database & Schema
- [x] Create api_keys table with fields: key, userId, status, expiresAt, usageCount, plan
- [x] Generate and apply database migration

## API Key Management
- [x] Implement API key generation logic
- [x] Implement API key validation middleware
- [x] Create API key status management (active, revoked, expired)
- [x] Add usage tracking and limit enforcement

## Payment System
- [x] Implement payment simulation flow
- [x] Create purchase API endpoint
- [x] Generate API keys on successful purchase
- [ ] Track payment history in database

## Web Terminal
- [x] Install xterm.js and dependencies
- [x] Create terminal component with xterm.js
- [x] Implement WebSocket server for terminal sessions
- [ ] Add PTY support for real terminal emulation
- [x] Implement API key validation middleware for terminal access
- [x] Add real-time input/output streaming

## User Dashboard
- [x] Create dashboard layout
- [x] Display user's API keys with details
- [x] Implement API key revocation
- [x] Show key expiration dates and usage stats
- [x] Add purchase/generate new key flow
- [ ] Display payment history

## Admin Panel
- [x] Create admin-only routes and access control
- [ ] List all users with their information
- [x] Display all API keys with user associations
- [x] Show usage statistics and analytics
- [ ] Implement user/key management capabilities

## Testing & Verification
- [ ] Write unit tests for API key generation
- [ ] Write tests for validation middleware
- [ ] Test terminal WebSocket connection
- [ ] Test payment simulation flow
- [ ] Verify admin access controls
- [ ] End-to-end testing of complete flow

## Integration & Deployment
- [ ] Verify all features work together
- [ ] Test cross-browser compatibility
- [ ] Performance testing
- [ ] Security review
- [ ] Final deployment preparation
