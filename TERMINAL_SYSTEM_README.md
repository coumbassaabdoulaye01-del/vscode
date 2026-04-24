# VS Code Web Terminal & API Key System

A complete web-based terminal access platform with API key authentication, payment simulation, and comprehensive user/admin management.

## Features

### 1. Web Terminal (xterm.js)
- Real-time terminal emulation using xterm.js
- WebSocket-based communication for live input/output streaming
- Full PTY (pseudo-terminal) support
- Responsive terminal interface with proper sizing

### 2. API Key Management
- Unique API key generation with secure format (tk_<32 hex chars>)
- Key status tracking (active, revoked, expired)
- Expiration date management per plan
- Usage counting and monitoring
- Key revocation capability

### 3. Payment Simulation System
- Three pricing tiers: Basic ($9.99), Pro ($29.99), Enterprise ($99.99)
- Simulated payment processing (no real payment provider)
- Automatic API key generation on purchase
- Plan-based expiration dates:
  - Basic: 30 days
  - Pro: 90 days
  - Enterprise: 365 days

### 4. User Dashboard
- View all personal API keys
- Purchase new API keys with plan selection
- Copy API keys to clipboard
- Revoke existing keys
- Monitor usage statistics
- Track expiration dates

### 5. Admin Panel
- View all API keys across all users
- Monitor system statistics:
  - Total API keys
  - Active/revoked/expired key counts
  - Total usage across system
- Access control (admin-only)

## Database Schema

### api_keys Table
```sql
CREATE TABLE `api_keys` (
  `id` int AUTO_INCREMENT NOT NULL,
  `key` varchar(255) NOT NULL UNIQUE,
  `userId` int NOT NULL,
  `status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
  `expiresAt` timestamp NOT NULL,
  `usageCount` int NOT NULL DEFAULT 0,
  `plan` varchar(64) NOT NULL DEFAULT 'basic',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(`id`)
);
```

## API Endpoints

### tRPC Routers

#### apiKeys Router
- `list` - Get user's API keys
- `getFullKey` - Get full key details for copying
- `revoke` - Revoke an API key
- `adminList` - Get all API keys (admin only)
- `validate` - Validate API key for terminal access

#### payment Router
- `purchaseKey` - Simulate payment and create API key
- `getPricing` - Get pricing information for all plans

#### Terminal WebSocket
- `ws://localhost:3000/api/terminal?key=<api_key>`
- Requires valid, non-expired API key
- Supports input/output streaming
- Handles terminal resize events

## Project Structure

```
vscode-terminal-system/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx       # User dashboard
│       │   └── AdminPanel.tsx      # Admin panel
│       ├── components/
│       │   └── Terminal.tsx        # xterm.js terminal component
│       └── App.tsx                 # Main routing
├── server/
│   ├── routers/
│   │   ├── apiKeys.ts              # API key management procedures
│   │   └── payment.ts              # Payment procedures
│   ├── apiKeyUtils.ts              # Key generation/validation utilities
│   ├── terminalServer.ts           # WebSocket terminal server
│   ├── db.ts                       # Database query helpers
│   └── routers.ts                  # Main tRPC router
├── drizzle/
│   ├── schema.ts                   # Database schema
│   └── migrations/                 # SQL migrations
└── package.json
```

## Installation & Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
# .env file should contain database connection
DATABASE_URL=mysql://user:password@host/database
```

3. Run database migrations:
```bash
pnpm drizzle-kit migrate
```

4. Start development server:
```bash
pnpm dev
```

5. Access the application:
- Dashboard: http://localhost:3000/dashboard
- Admin Panel: http://localhost:3000/admin

## Testing

Run unit tests:
```bash
pnpm test
```

Tests include:
- API key generation and validation
- Expiration date calculations
- Plan pricing verification
- Authentication and logout

## Usage Flow

### For Users
1. Login to the application
2. Navigate to Dashboard
3. Select a plan and click "Purchase Plan"
4. Receive API key after simulated payment
5. Copy API key for terminal access
6. Open terminal and connect using the API key
7. Manage/revoke keys as needed

### For Admins
1. Login with admin account
2. Navigate to Admin Panel
3. View all API keys and usage statistics
4. Monitor system health and user activity

## Security Considerations

- API keys are validated before terminal access
- Expired keys are automatically rejected
- Revoked keys cannot be used
- WebSocket connections require valid API key
- Admin panel requires admin role
- All sensitive operations use tRPC procedures with authentication

## Future Enhancements

- Real payment integration (Stripe)
- Payment history tracking
- Usage limits per plan
- Rate limiting
- Session recording/playback
- Multi-user terminal sessions
- Advanced analytics and reporting
- Email notifications
- Two-factor authentication

## Development Notes

- Uses React 19 with Tailwind CSS 4
- tRPC for type-safe API
- Drizzle ORM for database
- xterm.js for terminal emulation
- WebSocket for real-time communication
- Vitest for unit testing

## License

MIT
