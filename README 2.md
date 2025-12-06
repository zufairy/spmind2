# Tutor App - AI-Powered Learning Assistant

A comprehensive mobile application built with React Native and Expo that helps students with their studies through AI-powered features, note-taking, and recording capabilities.

## 🚀 Features

### 🔐 User Authentication
- **Secure Registration**: Create accounts with email, password, and student profile information
- **Student Profiles**: Store school, age, birth date, and grade level information
- **Login/Logout**: Secure authentication with Supabase
- **Password Reset**: Email-based password recovery

### 📝 Dynamic Note Management
- **Real-time Notes**: Create, edit, and delete notes with full database persistence
- **Note Types**: Support for general, homework, study, and personal notes
- **Color Coding**: Organize notes with 5 different colors
- **Tagging System**: Add custom tags to categorize notes
- **Pin Notes**: Mark important notes for quick access

### 🗂️ Sticky Notes System
- **Interactive Sticky Notes**: Create task-based sticky notes with completion tracking
- **Multiple Types**: Task, creative, technical, educational, and inspirational notes
- **Position Tracking**: Store note positions for custom layouts
- **Database Persistence**: All notes are permanently stored and synced

### 🎤 Audio Recording & AI
- **Voice Recording**: Record study sessions and lectures
- **AI Transcription**: Convert speech to text automatically
- **Subject Detection**: AI identifies study subjects from recordings
- **Smart Note Generation**: AI creates relevant sticky notes from transcripts

### 🎨 Modern UI/UX
- **Beautiful Design**: Modern gradient-based interface with smooth animations
- **Responsive Layout**: Optimized for different screen sizes
- **Smooth Animations**: React Native Animated and Animatable components
- **Intuitive Navigation**: Tab-based navigation with protected routes

## 🛠️ Tech Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript development
- **React Navigation**: Navigation and routing
- **React Native Animated**: Smooth animations

### Backend & Database
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **PostgreSQL**: Relational database with advanced features
- **Row Level Security**: Data privacy and security
- **Real-time Subscriptions**: Live data updates

### Authentication & Security
- **Supabase Auth**: Secure user authentication
- **JWT Tokens**: Stateless authentication
- **Row Level Security**: Database-level access control
- **AsyncStorage**: Secure local data storage

## 📱 Screenshots

The app features a modern, gradient-based design with:
- Authentication screens (Login/Register)
- Main dashboard with AI features
- Notes management with sticky notes
- Recording sessions with AI analysis
- Profile management
- Community features

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key
   - Create a `.env` file with your credentials

4. **Set up the database**
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
   - This creates all necessary tables and security policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Environment Variables

✅ **Already Configured!** Your Supabase credentials are already set up and ready to use.

**Current Configuration:**
- **Project URL**: `https://dzothjxrsbrxezqzkesx.supabase.co`
- **Anon Key**: Configured and ready

If you need to change these credentials, update the `services/supabase.ts` file directly.

## 🗄️ Database Schema

### Users Table
- User profiles with school, age, birth date information
- Linked to Supabase Auth for secure authentication

### Notes Table
- Main notes with title, content, type, and metadata
- User-specific with full CRUD operations

### Sticky Notes Table
- Individual sticky notes linked to main notes
- Includes position data and completion status

### Recording Sessions Table
- Audio recordings with transcripts and AI analysis
- Subject detection and note generation

## 🔒 Security Features

- **Row Level Security**: Users can only access their own data
- **Authentication**: Secure login with JWT tokens
- **Data Validation**: Input validation on client and server
- **Secure Storage**: Passwords hashed by Supabase Auth

## 📚 API Documentation

The app uses Supabase's built-in REST API:

- **Authentication**: `/auth/v1/*` endpoints
- **Notes**: `/rest/v1/notes` CRUD operations
- **Sticky Notes**: `/rest/v1/sticky_notes` CRUD operations
- **Recording Sessions**: `/rest/v1/recording_sessions` CRUD operations

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📦 Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Build for web
expo build:web
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team**: For the amazing development platform
- **Supabase Team**: For the powerful backend service
- **React Native Community**: For the excellent ecosystem
- **OpenAI**: For AI-powered features

## 📞 Support

If you have any questions or need help:
- Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions
- Review the [Supabase documentation](https://supabase.com/docs)
- Open an issue in this repository

## 🚀 Roadmap

- [ ] Real-time collaborative notes
- [ ] Advanced AI features
- [ ] Offline support
- [ ] Push notifications
- [ ] Social features
- [ ] Advanced analytics
- [ ] Multi-language support

---

**Built with ❤️ for students everywhere**
