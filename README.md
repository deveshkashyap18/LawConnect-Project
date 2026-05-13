# LawConnect

A modern platform connecting clients with lawyers for consultations and legal case management. Built with Node.js, Express, MongoDB, React, and Socket.io for real-time messaging.

## Features

- **User Authentication**: Email/password-based authentication with role-based access (Client, Lawyer, Admin)
- **Lawyer Directory**: Browse and search lawyers with filters (experience, rating, price range)
- **Booking System**: Schedule consultations and case bookings with status tracking
- **Real-time Messaging**: Socket.io-powered instant messaging between clients and lawyers
- **Notification System**: Real-time notifications for booking approvals, messages, and updates
- **Admin Dashboard**: Manage users, bookings, and platform data
- **Responsive UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT & bcryptjs
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Security**: CORS, JWT tokens

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **UI Components**: Shadcn UI with Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client

## Project Structure

```
LawConnect/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app configuration
│   │   ├── socket.js           # Socket.io setup
│   │   ├── config/             # Database configuration
│   │   ├── controllers/        # Route controllers
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Authentication & middleware
│   │   ├── lib/                # Utility functions
│   │   └── seed/               # Database seeding
│   ├── server.js               # Server entry point
│   ├── env.js                  # Environment configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context
│   │   ├── lib/                # Utility functions & API clients
│   │   ├── hooks/              # Custom React hooks
│   │   ├── data/               # Mock/dummy data
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## Booking Lifecycle

1. **Pending**: Client creates booking, slot is marked as booked
2. **Approved**: Lawyer reviews and approves the booking
3. **Completed**: Booking is marked as completed after session
4. **Cancelled**: Either party can cancel at any point

## Message Gating

- Messages can only be sent between clients and lawyers who have an active booking
- Each message is associated with a specific booking
- Only participants of a booking can access its messages

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lawconnect
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

4. Seed database (optional):
```bash
npm run dev
```
Then call the seed endpoint or import seed data manually.

5. Start server:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
VITE_API_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile
- `POST /auth/logout` - Logout user

### Bookings
- `POST /bookings` - Create booking
- `GET /bookings` - Get user's bookings
- `PATCH /bookings/:id/approve` - Approve booking
- `PATCH /bookings/:id/complete` - Mark as completed
- `PATCH /bookings/:id/cancel` - Cancel booking

### Messages
- `POST /messages` - Send message
- `GET /messages/:bookingId` - Get messages for booking
- `GET /messages` - Get user's messages

### Lawyers
- `GET /data/lawyers` - List lawyers with filters
- `GET /data/lawyers/:id` - Get lawyer profile
- `GET /data/slots/:lawyerId` - Get lawyer's available slots

### Admin
- `GET /admin/users` - List all users
- `GET /admin/bookings` - List all bookings

## Socket.io Events

### Client -> Server
- `joinRoom` - Join conversation room
- `sendMessage` - Send message
- `leaveRoom` - Leave conversation

### Server -> Client
- `messageReceived` - New message received
- `notificationReceived` - Notification (booking approval, etc.)
- `bookingUpdated` - Booking status changed

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=         # MongoDB connection string
JWT_SECRET=          # JWT secret key
FRONTEND_URL=        # Frontend URL for CORS
PORT=5000            # Server port
NODE_ENV=development # Environment
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000  # Backend API URL
```

## Development

### Run Backend in Dev Mode
```bash
cd backend
npm run dev
```

### Run Frontend in Dev Mode
```bash
cd frontend
npm run dev
```

### Build Frontend
```bash
cd frontend
npm run build
```

## Features Implemented

- ✅ Email/Password Authentication (Google OAuth removed)
- ✅ Role-based Access Control (Client, Lawyer, Admin)
- ✅ Booking Status Management (Pending → Approved → Completed/Cancelled)
- ✅ Message Gating (Messages require active booking)
- ✅ Real-time Messaging with Socket.io
- ✅ Lawyer Search & Filtering
- ✅ Notifications System
- ✅ Admin Dashboard
- ✅ Responsive UI with Tailwind CSS

## Documentation

- [Booking Guide](./BOOKING_GUIDE.md) - Booking workflow and implementation details
- [Messaging Guide](./MESSAGING_GUIDE.md) - Messaging system and socket events
- [Session Management](./SESSION_MANAGEMENT.md) - Session handling and authentication
- [Slot Booking Implementation](./SLOT_BOOKING_IMPLEMENTATION.md) - Detailed slot booking logic

## Contributing

1. Create a new branch for features/fixes
2. Make changes and test thoroughly
3. Commit with clear messages
4. Push to branch and create a pull request

## License

MIT License - feel free to use this project for learning and development purposes.

## Support

For issues, questions, or suggestions, please create an issue in the repository.

---

**Last Updated**: April 2026
